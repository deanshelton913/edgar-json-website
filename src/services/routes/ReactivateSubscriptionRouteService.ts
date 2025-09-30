import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { StripeService } from "../stripe/StripeService";
import { SubscriptionDataAccess } from "../data-access/SubscriptionDataAccess";
import { LoggingService } from "../LoggingService";
import { FailureByDesign } from "@/lib/errors/FailureByDesign";

export interface ReactivateSubscriptionResult {
  success: boolean;
  message?: string;
  error?: string;
}

@injectable()
export class ReactivateSubscriptionRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("StripeService") private stripeService: StripeService,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
  ) {}

  /**
   * Main entry point for reactivate subscription route - reactivates user's subscription
   */
  async postInvokeV1(request: NextRequest): Promise<ReactivateSubscriptionResult> {
    try {
      this.loggingService.debug('[REACTIVATE_SUBSCRIPTION_ROUTE] Starting reactivate subscription request');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[REACTIVATE_SUBSCRIPTION_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Get user ID from middleware headers
      const userId = request.headers.get('x-user-id');
      
      if (!userId) {
        throw FailureByDesign.unauthorized('Authentication required');
      }

      // Convert string ID to number for database operations
      const userDbId = parseInt(userId, 10);
      if (isNaN(userDbId)) {
        throw FailureByDesign.badRequest('Invalid user ID');
      }

      // Get user's current subscription using database ID
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(userDbId);
      
      if (!subscription) {
        throw FailureByDesign.notFound('No active subscription found');
      }

      if (!subscription.stripeSubscriptionId) {
        throw FailureByDesign.badRequest('Invalid subscription');
      }

      // Prevent reactivation of free subscriptions
      if (subscription.planId === 'free') {
        throw FailureByDesign.badRequest('Free subscriptions cannot be reactivated');
      }

      // Reactivate subscription in Stripe (skip if it's a test subscription)
      if (subscription.stripeSubscriptionId.startsWith('test_')) {
        this.loggingService.debug(`[REACTIVATE_SUBSCRIPTION_ROUTE] Skipping Stripe reactivation for test subscription: ${subscription.stripeSubscriptionId}`);
      } else {
        await this.stripeService.reactivateSubscription(subscription.stripeSubscriptionId);
      }

      // Update subscription status in database
      await this.subscriptionDataAccess.updateSubscriptionStatus(
        subscription.stripeSubscriptionId,
        'active', // Still active
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd,
        false, // cancelAtPeriodEnd = false
        undefined // canceledAt stays undefined
      );

      this.loggingService.debug(`[REACTIVATE_SUBSCRIPTION_ROUTE] Subscription reactivated for user: ${userDbId}`);

      return {
        success: true,
        message: 'Subscription has been reactivated'
      };

    } catch (error) {
      this.loggingService.error(`[REACTIVATE_SUBSCRIPTION_ROUTE] Error reactivating subscription: ${error}`);
      
      // Re-throw FailureByDesign errors as-is
      if (error instanceof FailureByDesign) {
        throw error;
      }
      
      // Convert unexpected errors to internal server error
      throw new Error(`Failed to reactivate subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
