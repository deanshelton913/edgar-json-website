import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { SubscriptionDataAccess } from "../data-access/SubscriptionDataAccess";
import { ApiKeyDataAccess } from "../data-access/ApiKeyDataAccess";
import { ApiKeyCacheService } from "../ApiKeyCacheService";
import { LoggingService } from "../LoggingService";
import { FailureByDesign } from "@/lib/errors/FailureByDesign";

export interface DowngradeCanceledResult {
  success: boolean;
  message?: string;
  error?: string;
}

@injectable()
export class DowngradeCanceledRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
    @inject("ApiKeyDataAccess") private apiKeyDataAccess: ApiKeyDataAccess,
    @inject("ApiKeyCacheService") private apiKeyCacheService: ApiKeyCacheService,
  ) {}

  /**
   * Main entry point for downgrade canceled route - downgrades canceled subscription to free tier
   */
  async postInvokeV1(request: NextRequest): Promise<DowngradeCanceledResult> {
    try {
      this.loggingService.debug('[DOWNGRADE_CANCELED_ROUTE] Starting downgrade canceled request');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[DOWNGRADE_CANCELED_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Authenticate user
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);
      
      if (!authResult.success) {
        throw FailureByDesign.unauthorized(authResult.message || 'Authentication required');
      }

      const userId = authResult.userId;
      if (!userId) {
        throw FailureByDesign.unauthorized('User ID not found');
      }

      // Convert string ID to number for database operations
      const userDbId = parseInt(userId, 10);
      if (isNaN(userDbId)) {
        throw FailureByDesign.badRequest('Invalid user ID');
      }

      // Get user's current subscription using database ID
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(userDbId);
      
      if (!subscription) {
        throw FailureByDesign.notFound('No subscription found');
      }

      // Only allow downgrade if subscription is canceled at period end
      if (!subscription.cancelAtPeriodEnd) {
        throw FailureByDesign.badRequest('Subscription is not canceled');
      }

      // Downgrade API key to free tier
      // Get user's current API key info
      const currentApiKey = await this.apiKeyDataAccess.getApiKeyByUserId(userDbId);
      if (!currentApiKey) {
        throw FailureByDesign.notFound('No API key found');
      }
      
      // Clear the cache so new limits take effect immediately
      await this.apiKeyCacheService.invalidateApiKey(currentApiKey.apiKey);

      this.loggingService.debug(`[DOWNGRADE_CANCELED_ROUTE] Cleared API key cache for user ${userDbId} - tier now managed by subscription`);

      return {
        success: true,
        message: 'API key downgraded to free tier. You will keep Pro billing access until the end of your current period.'
      };

    } catch (error) {
      this.loggingService.error(`[DOWNGRADE_CANCELED_ROUTE] Error downgrading canceled subscription: ${error}`);
      
      // Re-throw FailureByDesign errors as-is
      if (error instanceof FailureByDesign) {
        throw error;
      }
      
      // Convert unexpected errors to internal server error
      throw new Error(`Failed to downgrade subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
