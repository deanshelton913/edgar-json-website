import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { SubscriptionDataAccess } from "../data-access/SubscriptionDataAccess";
import { LoggingService } from "../LoggingService";
import { FailureByDesign } from "@/lib/errors/FailureByDesign";

export interface BillingSubscriptionResult {
  success: boolean;
  planId?: string;
  status?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  error?: string;
  message?: string;
}

@injectable()
export class BillingSubscriptionRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
  ) {}

  /**
   * Main entry point for billing subscription route - gets user's subscription info
   */
  async getInvokeV1(request: NextRequest): Promise<BillingSubscriptionResult> {
    try {
      this.loggingService.debug('[BILLING_SUBSCRIPTION_ROUTE] Starting subscription request');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[BILLING_SUBSCRIPTION_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Authorize the request using cookie-based authentication
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);

      if (!authResult.success) {
        this.loggingService.warn('[BILLING_SUBSCRIPTION_ROUTE] Unauthorized request');
        throw FailureByDesign.unauthorized(authResult.message || 'Authentication required');
      }

      const userId = authResult.userId!;
      this.loggingService.debug(`[BILLING_SUBSCRIPTION_ROUTE] Getting subscription for user: ${userId}`);

      // Convert string ID to number for database operations
      const userDbId = parseInt(userId, 10);
      if (isNaN(userDbId)) {
        this.loggingService.warn(`[BILLING_SUBSCRIPTION_ROUTE] Invalid user ID: ${userId}`);
        throw FailureByDesign.badRequest('Invalid user ID');
      }

      // Get subscription data using database ID
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(userDbId);

      if (!subscription) {
        // Return default free plan
        return {
          success: true,
          planId: 'free',
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        };
      }

      this.loggingService.debug(`[BILLING_SUBSCRIPTION_ROUTE] Found subscription: ${subscription.id} for user: ${userDbId}`);

      return {
        success: true,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      };

    } catch (error) {
      this.loggingService.error(`[BILLING_SUBSCRIPTION_ROUTE] Error getting subscription: ${error}`);
      
      // Re-throw FailureByDesign errors as-is
      if (error instanceof FailureByDesign) {
        throw error;
      }
      
      // Convert unexpected errors to internal server error
      throw new Error(`Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
