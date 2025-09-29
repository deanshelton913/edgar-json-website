import { injectable, inject } from 'tsyringe';
import { StripeService } from './StripeService';
import { SubscriptionDataAccess } from '@/data-access/SubscriptionDataAccess';
import { UserDataAccess } from '@/data-access/UserDataAccess';
import { LoggingService } from './LoggingService';
import { container } from '@/lib/container';
import Stripe from 'stripe';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Stripe.Checkout.Session | Stripe.Subscription | Stripe.Invoice;
  };
}

@injectable()
export class WebhookService {
  constructor(
    @inject('StripeService') private stripeService: StripeService,
    @inject('SubscriptionDataAccess') private subscriptionDataAccess: SubscriptionDataAccess,
    @inject('UserDataAccess') private userDataAccess: UserDataAccess,
    @inject('LoggingService') private loggingService: LoggingService,
  ) {}

  async processWebhookEvent(event: StripeWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        // Silently ignore unhandled events
        break;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    try {
      this.loggingService.debug(`[WEBHOOK_SERVICE] Checkout session completed: ${session.id}`);
      
      const userId = this.extractUserIdFromMetadata(session.metadata);
      if (!userId) {
        this.loggingService.error(`[WEBHOOK_SERVICE] No userId in checkout session metadata`);
        return;
      }

      const user = await this.userDataAccess.getUserById(userId);
      if (!user) {
        this.loggingService.error(`[WEBHOOK_SERVICE] User not found: ${userId}`);
        return;
      }

      // Check if user has existing subscriptions before creating new one
      const existingSubscriptions = await this.subscriptionDataAccess.getActiveSubscriptionsByUserId(userId);
      this.loggingService.debug(`[WEBHOOK_SERVICE] User ${userId} has ${existingSubscriptions.length} existing subscriptions before checkout completion`);

      if (session.subscription) {
        await this.createSubscriptionFromSession(session, user.id);
      }

    } catch (error) {
      this.loggingService.error(`[WEBHOOK_SERVICE] Error handling checkout session: ${error}`);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      this.loggingService.debug(`[WEBHOOK_SERVICE] Subscription updated: ${subscription.id} (status: ${subscription.status})`);
      
      const existingSubscription = await this.subscriptionDataAccess.getSubscriptionByStripeId(subscription.id);
      
      if (!existingSubscription) {
        this.loggingService.debug(`[WEBHOOK_SERVICE] New subscription detected: ${subscription.id}`);
        // This is a new subscription - check if user has other active subscriptions
        await this.handleNewSubscription(subscription);
      } else {
        this.loggingService.debug(`[WEBHOOK_SERVICE] Updating existing subscription: ${subscription.id}`);
        await this.updateExistingSubscription(subscription);
      }

    } catch (error) {
      this.loggingService.error(`[WEBHOOK_SERVICE] Error handling subscription update: ${error}`);
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      this.loggingService.debug(`[WEBHOOK_SERVICE] Subscription deleted: ${subscription.id}`);
      
      await this.subscriptionDataAccess.updateSubscriptionStatus(
        subscription.id,
        'canceled',
        undefined,
        undefined,
        true,
        new Date()
      );

    } catch (error) {
      this.loggingService.error(`[WEBHOOK_SERVICE] Error handling subscription deletion: ${error}`);
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      this.loggingService.debug(`[WEBHOOK_SERVICE] Payment succeeded: ${invoice.id}`);
      
      if (invoice.subscription) {
        await this.subscriptionDataAccess.updateSubscriptionStatus(
          invoice.subscription as string,
          'active'
        );
      }

    } catch (error) {
      this.loggingService.error(`[WEBHOOK_SERVICE] Error handling payment success: ${error}`);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      this.loggingService.debug(`[WEBHOOK_SERVICE] Payment failed: ${invoice.id}`);
      
      if (invoice.subscription) {
        await this.subscriptionDataAccess.updateSubscriptionStatus(
          invoice.subscription as string,
          'past_due'
        );
      }

    } catch (error) {
      this.loggingService.error(`[WEBHOOK_SERVICE] Error handling payment failure: ${error}`);
    }
  }

  private extractUserIdFromMetadata(metadata: Stripe.Metadata | null): number | null {
    const userId = metadata?.userId;
    if (!userId) {
      this.loggingService.error(`[WEBHOOK_SERVICE] No userId in metadata`);
      return null;
    }

    const userDbId = parseInt(userId, 10);
    if (isNaN(userDbId)) {
      this.loggingService.error(`[WEBHOOK_SERVICE] Invalid userId: ${userId}`);
      return null;
    }

    return userDbId;
  }

  private async createSubscriptionFromSession(session: Stripe.Checkout.Session, userId: number): Promise<void> {
    const subscriptionId = session.subscription as string;
    if (!subscriptionId) {
      this.loggingService.error(`[WEBHOOK_SERVICE] No subscription ID in session: ${session.id}`);
      return;
    }

    const subscription = await this.stripeService.getSubscription(subscriptionId);
    if (!subscription) {
      this.loggingService.error(`[WEBHOOK_SERVICE] Subscription not found: ${session.subscription}`);
      return;
    }

    // Check if user has existing subscriptions and cancel them
    const existingSubscriptions = await this.subscriptionDataAccess.getActiveSubscriptionsByUserId(userId);
    
    if (existingSubscriptions.length > 0) {
      this.loggingService.debug(`[WEBHOOK_SERVICE] User ${userId} has ${existingSubscriptions.length} existing subscriptions. Canceling old ones before creating new subscription.`);
      
      // Cancel all existing subscriptions in Stripe and mark as canceled in DB
      for (const existingSub of existingSubscriptions) {
        try {
          this.loggingService.debug(`[WEBHOOK_SERVICE] Canceling old subscription: ${existingSub.stripeSubscriptionId} (plan: ${existingSub.planId})`);
          
          // Cancel in Stripe with prorated refund for upgrades
          await this.stripeService.cancelSubscription(existingSub.stripeSubscriptionId, true);
          
          // Mark as canceled in database
          await this.subscriptionDataAccess.updateSubscriptionStatus(
            existingSub.stripeSubscriptionId,
            'canceled',
            undefined,
            undefined,
            true,
            new Date()
          );
          
          this.loggingService.debug(`[WEBHOOK_SERVICE] Successfully canceled old subscription: ${existingSub.stripeSubscriptionId}`);
        } catch (error) {
          this.loggingService.error(`[WEBHOOK_SERVICE] Error canceling old subscription ${existingSub.stripeSubscriptionId}: ${error}`);
        }
      }
    }

    await this.subscriptionDataAccess.createSubscription({
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      planId: session.metadata?.planId || 'pro',
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    this.loggingService.debug(`[WEBHOOK_SERVICE] New subscription created for user: ${userId}`);
  }

  private async handleNewSubscription(subscription: Stripe.Subscription): Promise<void> {
    const userId = this.extractUserIdFromMetadata(subscription.metadata);
    if (!userId) {
      this.loggingService.error(`[WEBHOOK_SERVICE] No userId found in subscription metadata`);
      return;
    }

    this.loggingService.debug(`[WEBHOOK_SERVICE] Handling new subscription ${subscription.id} for user ${userId}`);

    // Check if user has other active subscriptions
    const userDataAccess = container.resolve(UserDataAccess);
    const user = await userDataAccess.getUserById(userId);
    if (!user) {
      this.loggingService.error(`[WEBHOOK_SERVICE] User not found: ${userId}`);
      return;
    }

    // Get all active subscriptions for this user
    const existingSubscriptions = await this.subscriptionDataAccess.getActiveSubscriptionsByUserId(userId);
    
    this.loggingService.debug(`[WEBHOOK_SERVICE] Found ${existingSubscriptions.length} existing subscriptions for user ${userId}`);
    
    if (existingSubscriptions.length > 0) {
      this.loggingService.debug(`[WEBHOOK_SERVICE] User ${userId} has ${existingSubscriptions.length} existing subscriptions. Canceling old ones.`);
      
      // Cancel all existing subscriptions in Stripe and mark as canceled in DB
      for (const existingSub of existingSubscriptions) {
        try {
          this.loggingService.debug(`[WEBHOOK_SERVICE] Canceling old subscription: ${existingSub.stripeSubscriptionId} (plan: ${existingSub.planId})`);
          
          // Cancel in Stripe with prorated refund for upgrades
          await this.stripeService.cancelSubscription(existingSub.stripeSubscriptionId, true);
          
          // Mark as canceled in database
          await this.subscriptionDataAccess.updateSubscriptionStatus(
            existingSub.stripeSubscriptionId,
            'canceled',
            undefined,
            undefined,
            true,
            new Date()
          );
          
          this.loggingService.debug(`[WEBHOOK_SERVICE] Successfully canceled old subscription: ${existingSub.stripeSubscriptionId}`);
        } catch (error) {
          this.loggingService.error(`[WEBHOOK_SERVICE] Error canceling old subscription ${existingSub.stripeSubscriptionId}: ${error}`);
        }
      }
    }

    // Create the new subscription
    this.loggingService.debug(`[WEBHOOK_SERVICE] Creating new subscription ${subscription.id} for user ${userId}`);
    await this.createNewSubscription(subscription);
  }

  private async createNewSubscription(subscription: Stripe.Subscription): Promise<void> {
    const userId = this.extractUserIdFromMetadata(subscription.metadata);
    if (!userId) return;

    const user = await this.userDataAccess.getUserById(userId);
    if (!user) {
      this.loggingService.error(`[WEBHOOK_SERVICE] User not found: ${userId}`);
      return;
    }

    await this.subscriptionDataAccess.createSubscription({
      userId: user.id,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      planId: subscription.metadata?.planId || 'pro',
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    this.loggingService.debug(`[WEBHOOK_SERVICE] New subscription created for user: ${user.id}`);
  }

  private async updateExistingSubscription(subscription: Stripe.Subscription): Promise<void> {
    await this.subscriptionDataAccess.updateSubscriptionStatus(
      subscription.id,
      subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid',
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.cancel_at_period_end,
      subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined
    );

    this.loggingService.debug(`[WEBHOOK_SERVICE] Subscription updated: ${subscription.id}`);
  }
}
