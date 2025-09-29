import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { ApiKeyDataAccess } from "../data-access/ApiKeyDataAccess";
import { UserDataAccess } from "../data-access/UserDataAccess";
import { LoggingService } from "../LoggingService";

export interface ApiKeyDeleteResult {
  success: boolean;
  message?: string;
  error?: string;
}

@injectable()
export class ApiKeyDeleteRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
    @inject("UserDataAccess") private userDataAccess: UserDataAccess,
    @inject("ApiKeyDataAccess") private apiKeyDataAccess: ApiKeyDataAccess,
  ) {}

  /**
   * Main entry point for API key delete route - handles all logic
   */
  async deleteInvokeV1(request: NextRequest): Promise<ApiKeyDeleteResult> {
    try {
      this.loggingService.debug('[API_KEY_DELETE_ROUTE] Starting API key delete request');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[API_KEY_DELETE_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Authorize the request using cookie-based authentication
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);

      if (!authResult.success) {
        this.loggingService.warn('[API_KEY_DELETE_ROUTE] Unauthorized request');
        return {
          success: false,
          error: 'Unauthorized',
          message: authResult.message || 'Authentication required'
        };
      }

      const userId = parseInt(authResult.userId!);
      this.loggingService.debug(`[API_KEY_DELETE_ROUTE] Deleting API key for user ID: ${userId}`);

      // Get the user to verify they exist
      const user = await this.userDataAccess.getUserById(userId);
      
      if (!user) {
        this.loggingService.warn(`[API_KEY_DELETE_ROUTE] User not found: ${userId}`);
        return {
          success: false,
          error: 'User not found',
          message: 'User account not found'
        };
      }

      // Delete the API key
      await this.apiKeyDataAccess.deleteApiKeyByUserId(user.id);

      this.loggingService.info(`[API_KEY_DELETE_ROUTE] Successfully deleted API key for user: ${userId}`);

      return {
        success: true,
        message: 'API key deleted successfully'
      };

    } catch (error) {
      this.loggingService.error(`[API_KEY_DELETE_ROUTE] Error deleting API key: ${error}`);
      throw error;
    }
  }
}