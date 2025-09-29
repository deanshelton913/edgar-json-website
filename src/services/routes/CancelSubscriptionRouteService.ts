import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { StripeService } from "../stripe/StripeService";
import { SubscriptionDataAccess } from "../data-access/SubscriptionDataAccess";
import { LoggingService } from "../LoggingService";

export interface CancelSubscriptionResult {
  success: boolean;
  message?: string;
  error?: string;
}

@injectable()
export class CancelSubscriptionRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
    @inject("StripeService") private stripeService: StripeService,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
  ) {}

  /**
   * Main entry point for cancel subscription route - cancels user's subscription
   */
  async postInvokeV1(request: NextRequest): Promise<CancelSubscriptionResult> {
    try {
      this.loggingService.debug('[CANCEL_SUBSCRIPTION_ROUTE] Starting cancel subscription request');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[CANCEL_SUBSCRIPTION_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Authenticate user
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);
      
      if (!authResult.success) {
        return {
          success: false,
          error: 'Authentication required'
        };
      }

      const userId = authResult.userId;
      if (!userId) {
        return {
          success: false,
          error: 'User ID not found'
        };
      }

      // Convert string ID to number for database operations
      const userDbId = parseInt(userId, 10);
      if (isNaN(userDbId)) {
        return {
          success: false,
          error: 'Invalid user ID'
        };
      }

      // Get user's current subscription using database ID
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(userDbId);
      
      if (!subscription) {
        return {
          success: false,
          error: 'No active subscription found'
        };
      }

      if (!subscription.stripeSubscriptionId) {
        return {
          success: false,
          error: 'Invalid subscription'
        };
      }

      // Prevent cancellation of free subscriptions
      if (subscription.planId === 'free') {
        return {
          success: false,
          error: 'Free subscriptions cannot be canceled'
        };
      }

      // Cancel subscription in Stripe (skip if it's a test subscription)
      if (subscription.stripeSubscriptionId.startsWith('test_')) {
        this.loggingService.debug(`[CANCEL_SUBSCRIPTION_ROUTE] Skipping Stripe cancellation for test subscription: ${subscription.stripeSubscriptionId}`);
        // For test subscriptions, update the database directly
        await this.subscriptionDataAccess.updateSubscriptionStatus(
          subscription.stripeSubscriptionId,
          'active', // Still active until period end
          subscription.currentPeriodStart,
          subscription.currentPeriodEnd,
          true, // cancelAtPeriodEnd = true
          undefined // canceledAt stays undefined until period actually ends
        );
      } else {
        const updatedSubscription = await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);
        
        // Update subscription status in database with the actual Stripe data
        await this.subscriptionDataAccess.updateSubscriptionStatus(
          subscription.stripeSubscriptionId,
          updatedSubscription.status as 'active' | 'canceled' | 'past_due' | 'unpaid',
          new Date(updatedSubscription.current_period_start * 1000),
          new Date(updatedSubscription.current_period_end * 1000),
          updatedSubscription.cancel_at_period_end,
          updatedSubscription.canceled_at ? new Date(updatedSubscription.canceled_at * 1000) : undefined
        );
      }

      this.loggingService.debug(`[CANCEL_SUBSCRIPTION_ROUTE] Subscription canceled for user: ${userDbId}`);

      return {
        success: true,
        message: 'Subscription will be canceled at the end of the current billing period'
      };

    } catch (error) {
      this.loggingService.error(`[CANCEL_SUBSCRIPTION_ROUTE] Error canceling subscription: ${error}`);
      throw error;
    }
  }
}
