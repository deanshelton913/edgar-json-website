import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { StripeService } from "../stripe/StripeService";
import { SubscriptionDataAccess } from "../data-access/SubscriptionDataAccess";
import { UserDataAccess } from "../data-access/UserDataAccess";
import { LoggingService } from "../LoggingService";

export interface BillingInfoResult {
  success: boolean;
  email?: string;
  name?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  isTestCustomer?: boolean;
  error?: string;
  message?: string;
}

@injectable()
export class BillingInfoRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
    @inject("StripeService") private stripeService: StripeService,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
    @inject("UserDataAccess") private userDataAccess: UserDataAccess,
  ) {}

  /**
   * Main entry point for billing info route - gets user's billing information
   */
  async getInvokeV1(request: NextRequest): Promise<BillingInfoResult> {
    try {
      this.loggingService.debug('[BILLING_INFO_ROUTE] Starting billing info request');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[BILLING_INFO_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Authorize the request using cookie-based authentication
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);

      if (!authResult.success) {
        this.loggingService.warn('[BILLING_INFO_ROUTE] Unauthorized request');
        return {
          success: false,
          error: 'Unauthorized',
          message: authResult.message
        };
      }

      const userId = authResult.userId!;
      this.loggingService.debug(`[BILLING_INFO_ROUTE] Getting billing info for user: ${userId}`);

      // Convert string ID to number for database operations
      const userDbId = parseInt(userId, 10);
      if (isNaN(userDbId)) {
        this.loggingService.warn(`[BILLING_INFO_ROUTE] Invalid user ID: ${userId}`);
        return {
          success: false,
          error: 'Invalid user ID'
        };
      }

      // Get subscription to find Stripe customer ID
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(userDbId);

      // Get user data for email and name
      const user = await this.userDataAccess.getUserById(userDbId);
      
      if (!user) {
        this.loggingService.warn(`[BILLING_INFO_ROUTE] User not found: ${userDbId}`);
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (!subscription) {
        // Return basic user info for free plan
        return {
          success: true,
          email: user.email,
          name: user.name,
        };
      }

      // Get customer info from Stripe (skip for test customers)
      let customer = null;
      if (!subscription.stripeCustomerId.startsWith('test_')) {
        try {
          customer = await this.stripeService.getCustomer(subscription.stripeCustomerId);
          this.loggingService.debug(`[BILLING_INFO_ROUTE] Found customer: ${customer?.id} for user: ${userDbId}`);
        } catch {
          this.loggingService.warn(`[BILLING_INFO_ROUTE] Stripe customer not found: ${subscription.stripeCustomerId}`);
        }
      } else {
        this.loggingService.debug(`[BILLING_INFO_ROUTE] Skipping Stripe lookup for test customer: ${subscription.stripeCustomerId}`);
      }

      // Return billing info (use Stripe data if available, otherwise fall back to user data)
      return {
        success: true,
        email: customer?.email || user.email,
        name: customer?.name || user.name,
        address: customer?.address ? {
          line1: customer.address.line1 || '',
          line2: customer.address.line2 || undefined,
          city: customer.address.city || '',
          state: customer.address.state || '',
          postalCode: customer.address.postal_code || '',
          country: customer.address.country || '',
        } : undefined,
        isTestCustomer: subscription.stripeCustomerId.startsWith('test_'),
      };

    } catch (error) {
      this.loggingService.error(`[BILLING_INFO_ROUTE] Error getting billing info: ${error}`);
      throw error;
    }
  }
}
