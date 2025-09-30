import { injectable, inject } from 'tsyringe';
import Stripe from 'stripe';
import { LoggingService } from "@/services/LoggingService";
import { UserDataAccess } from "@/services/data-access/UserDataAccess";

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
}

export interface CreateCheckoutSessionParams {
  planId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePortalSessionParams {
  userId: string;
  returnUrl: string;
  configurationId?: string;
}

@injectable()
export class StripeService {
  private stripe: Stripe;
  private config: StripeConfig;

  constructor(
    @inject('LoggingService') private loggingService: LoggingService,
    @inject('UserDataAccess') private userDataAccess: UserDataAccess,
  ) {
    this.config = {
      secretKey: process.env.STRIPE_SECRET_KEY!,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
    };

    if (!this.config.secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

        this.stripe = new Stripe(this.config.secretKey, {
          apiVersion: '2025-01-27.acacia',
        });

    this.loggingService.debug('[STRIPE_SERVICE] Stripe service initialized');
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    try {
      this.loggingService.debug(`[STRIPE_SERVICE] Creating checkout session for plan: ${params.planId}, user: ${params.userId}`);

      const priceId = this.getPriceIdForPlan(params.planId);
      
      // First, get or create a customer to ensure payment methods are properly linked
      const customer = await this.getOrCreateCustomer(params.userId);
      
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer: customer.id, // Use customer ID instead of customer_email
        metadata: {
          userId: params.userId,
          planId: params.planId,
        },
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: {
          metadata: {
            userId: params.userId,
            planId: params.planId,
          },
        },
      });

      this.loggingService.debug(`[STRIPE_SERVICE] Checkout session created: ${session.id}`);
      return session;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error creating checkout session: ${error}`);
      throw error;
    }
  }

  async createPortalSession(params: CreatePortalSessionParams): Promise<Stripe.BillingPortal.Session> {
    try {
      this.loggingService.debug(`[STRIPE_SERVICE] Creating portal session for user: ${params.userId}`);

      // First, get or create a customer
      const customer = await this.getOrCreateCustomer(params.userId);

      // Create portal session with configuration
      const sessionParams: Stripe.BillingPortal.SessionCreateParams = {
        customer: customer.id,
        return_url: params.returnUrl,
      };

      // Add configuration if provided
      if (params.configurationId) {
        sessionParams.configuration = params.configurationId;
      }

      const session = await this.stripe.billingPortal.sessions.create(sessionParams);

      this.loggingService.debug(`[STRIPE_SERVICE] Portal session created: ${session.id}`);
      return session;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error creating portal session: ${error}`);
      throw error;
    }
  }


  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
      return customer;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error retrieving customer: ${error}`);
      return null;
    }
  }

  async getOrCreateCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // First, try to get the user from the database
      const user = await this.userDataAccess.getUserById(parseInt(userId));
      
      if (user && user.stripeCustomerId) {
        // User has an existing Stripe customer ID, retrieve it
        try {
          const customer = await this.stripe.customers.retrieve(user.stripeCustomerId) as Stripe.Customer;
          this.loggingService.debug(`[STRIPE_SERVICE] Retrieved existing customer: ${customer.id} for user: ${userId}`);
          return customer;
        } catch {
          this.loggingService.warn(`[STRIPE_SERVICE] Failed to retrieve customer ${user.stripeCustomerId}, creating new one`);
          // Customer might be deleted in Stripe, fall through to create new one
        }
      }

      // Create a new customer
      const customer = await this.stripe.customers.create({
        metadata: { userId },
      });

      // Store the customer ID in the database
      if (user) {
        await this.userDataAccess.updateStripeCustomerId(user.id, customer.id);
      }

      this.loggingService.debug(`[STRIPE_SERVICE] Created new customer: ${customer.id} for user: ${userId}`);
      return customer;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error getting/creating customer: ${error}`);
      throw error;
    }
  }

  async constructWebhookEvent(payload: string | Buffer, signature: string): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, this.config.webhookSecret);
    } catch (error) {
      // Don't log signature verification errors here - let the webhook handler decide
      throw error;
    }
  }

  private getPriceIdForPlan(planId: string): string {
    const priceIds: Record<string, string> = {
      'pro': process.env.STRIPE_PRO_PRICE_ID!,
      'enterprise': process.env.STRIPE_ENTERPRISE_PRICE_ID!,
    };

    const priceId = priceIds[planId];
    if (!priceId) {
      throw new Error(`No price ID configured for plan: ${planId}`);
    }

    return priceId;
  }

  /**
   * Cancel a subscription at the end of the current period
   */
  async cancelSubscription(subscriptionId: string, prorate: boolean = false): Promise<Stripe.Subscription> {
    try {
      this.loggingService.debug(`[STRIPE_SERVICE] Canceling subscription: ${subscriptionId} (prorate: ${prorate})`);
      
      if (prorate) {
        // For prorated cancellation, we need to cancel immediately and create a credit
        const subscription = await this.stripe.subscriptions.cancel(subscriptionId, {
          prorate: true,
        });
        this.loggingService.debug(`[STRIPE_SERVICE] Subscription canceled immediately with proration: ${subscriptionId}`);
        return subscription;
      } else {
        // Standard cancellation at period end
        const subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        this.loggingService.debug(`[STRIPE_SERVICE] Subscription canceled at period end: ${subscriptionId}`);
        return subscription;
      }
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error canceling subscription: ${error}`);
      throw error;
    }
  }

  /**
   * Immediately cancel a subscription (not recommended for production)
   */
  async cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      this.loggingService.debug(`[STRIPE_SERVICE] Immediately canceling subscription: ${subscriptionId}`);
      
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);

      this.loggingService.debug(`[STRIPE_SERVICE] Subscription immediately canceled: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error immediately canceling subscription: ${error}`);
      throw error;
    }
  }

  /**
   * Reactivate a canceled subscription (undo cancellation)
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      this.loggingService.debug(`[STRIPE_SERVICE] Reactivating subscription: ${subscriptionId}`);
      
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      this.loggingService.debug(`[STRIPE_SERVICE] Subscription reactivated: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error reactivating subscription: ${error}`);
      throw error;
    }
  }

  /**
   * Get a checkout session by ID
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
    try {
      this.loggingService.debug(`[STRIPE_SERVICE] Getting checkout session: ${sessionId}`);
      
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      this.loggingService.debug(`[STRIPE_SERVICE] Retrieved checkout session: ${sessionId}`);
      return session;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error getting checkout session: ${error}`);
      return null;
    }
  }

  /**
   * Create a default billing portal configuration
   */
  async createDefaultPortalConfiguration(): Promise<Stripe.BillingPortal.Configuration> {
    try {
      this.loggingService.debug('[STRIPE_SERVICE] Creating default portal configuration');

      const configuration = await this.stripe.billingPortal.configurations.create({
        business_profile: {
          headline: 'Edgar JSON API - Billing Management',
        },
        features: {
          payment_method_update: {
            enabled: true,
          },
          subscription_cancel: {
            enabled: true,
            mode: 'at_period_end',
            cancellation_reason: {
              enabled: true,
              options: [
                'too_expensive',
                'missing_features',
                'switched_service',
                'unused',
                'other',
              ],
            },
          },
          subscription_update: {
            enabled: false, // Disabled to avoid products parameter requirement
          },
        },
      });

      this.loggingService.debug(`[STRIPE_SERVICE] Default portal configuration created: ${configuration.id}`);
      return configuration;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error creating default portal configuration: ${error}`);
      throw error;
    }
  }

  /**
   * Get or create a default portal configuration
   */
  async getOrCreateDefaultPortalConfiguration(): Promise<string> {
    try {
      // Try to get existing configurations
      const configurations = await this.stripe.billingPortal.configurations.list({
        limit: 1,
      });

      if (configurations.data.length > 0) {
        const existingConfig = configurations.data[0];
        
        // Check if the existing configuration has the required products parameter
        const hasProductsParam = existingConfig.features?.subscription_update?.products !== undefined;
        
        if (hasProductsParam) {
          this.loggingService.debug(`[STRIPE_SERVICE] Using existing portal configuration: ${existingConfig.id}`);
          return existingConfig.id;
        } else {
          this.loggingService.debug(`[STRIPE_SERVICE] Existing configuration missing products param, updating: ${existingConfig.id}`);
          
          // Update the existing configuration to include products parameter
          await this.stripe.billingPortal.configurations.update(existingConfig.id, {
            features: {
              ...existingConfig.features,
              subscription_update: {
                ...existingConfig.features?.subscription_update,
                products: [], // Empty array allows all products
              },
            },
          });
          
          this.loggingService.debug(`[STRIPE_SERVICE] Updated existing portal configuration: ${existingConfig.id}`);
          return existingConfig.id;
        }
      }

      // Create a new default configuration
      const configuration = await this.createDefaultPortalConfiguration();
      return configuration.id;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error getting/creating default portal configuration: ${error}`);
      throw error;
    }
  }

  /**
   * Get a subscription by ID from Stripe
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      this.loggingService.debug(`[STRIPE_SERVICE] Getting subscription: ${subscriptionId}`);
      
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      this.loggingService.debug(`[STRIPE_SERVICE] Retrieved subscription: ${subscription.id}, status: ${subscription.status}`);
      return subscription;
    } catch (error) {
      this.loggingService.error(`[STRIPE_SERVICE] Error getting subscription: ${error}`);
      throw error;
    }
  }

  getPublishableKey(): string {
    return this.config.publishableKey;
  }
}
