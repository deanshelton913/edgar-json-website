import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { UserDataAccess } from "@/services/data-access";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { ApiKeyService } from "../ApiKeyService";
import { LoggingService } from "../LoggingService";
import { FailureByDesign } from "@/lib/errors/FailureByDesign";

export interface ApiKeyGetResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

export interface ApiKeyPostResult {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

@injectable()
export class ApiKeyRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
    @inject("UserDataAccess") private userDataAccess: UserDataAccess,
    @inject("ApiKeyService") private apiKeyService: ApiKeyService,
  ) {}

  /**
   * Main entry point for GET requests - retrieves user's API key
   */
  async getInvokeV1(request: NextRequest): Promise<ApiKeyGetResult> {
    try {
      this.loggingService.debug('[API_KEY_ROUTE] Starting GET request');
      
      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[API_KEY_ROUTE] GET request from IP: ${ipAddress}, User-Agent: ${userAgent}`);
      
      return await this.handleGetRequest(request);
    } catch (error) {
      this.loggingService.error(`[API_KEY_ROUTE] Error in GET request: ${error}`);
      
      // Re-throw FailureByDesign errors as-is
      if (error instanceof FailureByDesign) {
        throw error;
      }
      
      // Convert unexpected errors to internal server error
      throw new Error(`Failed to get API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Main entry point for POST requests - creates new API key
   */
  async postInvokeV1(request: NextRequest): Promise<ApiKeyPostResult> {
    try {
      this.loggingService.debug('[API_KEY_ROUTE] Starting POST request');
      
      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[API_KEY_ROUTE] POST request from IP: ${ipAddress}, User-Agent: ${userAgent}`);
      
      return await this.handlePostRequest(request);
    } catch (error) {
      this.loggingService.error(`[API_KEY_ROUTE] Error in POST request: ${error}`);
      
      // Re-throw FailureByDesign errors as-is
      if (error instanceof FailureByDesign) {
        throw error;
      }
      
      // Convert unexpected errors to internal server error
      throw new Error(`Failed to create API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle GET request - retrieve user's API key
   */
  private async handleGetRequest(request: NextRequest): Promise<ApiKeyGetResult> {
    try {
      this.loggingService.debug('[API_KEY_ROUTE] Handling GET request');
      
      // Authorize the request using cookie authentication
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);

      if (!authResult.success) {
        this.loggingService.debug('[API_KEY_ROUTE] Authentication failed:', authResult.error);
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to access your API key'
        };
      }

      this.loggingService.debug('[API_KEY_ROUTE] User ID from session:', authResult.userId);
      this.loggingService.debug('[API_KEY_ROUTE] User email from session:', authResult.email);
      
      // Get the user's database record using the numeric ID
      const userData = await this.userDataAccess.getUserById(parseInt(authResult.userId!));
      
      if (!userData) {
        this.loggingService.debug(`[API_KEY_ROUTE] User not found in database: ${authResult.userId}`);
        return {
          success: false,
          error: 'User not found',
          message: 'User account not found. Please contact support.'
        };
      }
      
      this.loggingService.debug(`[API_KEY_ROUTE] Found user in database with ID: ${userData.id}`);
      
      this.loggingService.debug('[API_KEY_ROUTE] Getting API key for user');
      
      // Get the user's API key with tier information using the database user ID
      const apiKey = await this.apiKeyService.getApiKeyWithTier(userData.id);
      
      this.loggingService.debug('[API_KEY_ROUTE] API key result:', !!apiKey);
      
      if (apiKey) {
        return {
          success: true,
          data: apiKey
        };
      } else {
        this.loggingService.debug('[API_KEY_ROUTE] No API key found for user');
        return {
          success: false,
          error: 'No API key found',
          message: 'User does not have an API key'
        };
      }

    } catch (error) {
      this.loggingService.error(`[API_KEY_ROUTE] Error in GET request: ${error}`);
      throw error;
    }
  }

  /**
   * Handle POST request - create new API key
   */
  private async handlePostRequest(request: NextRequest): Promise<ApiKeyPostResult> {
    try {
      this.loggingService.debug('[API_KEY_ROUTE] Handling POST request');
      
      // Authorize the request using cookie authentication
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);

      if (!authResult.success) {
        this.loggingService.debug('[API_KEY_ROUTE] Authentication failed:', authResult.error);
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to create an API key'
        };
      }

      this.loggingService.debug('[API_KEY_ROUTE] User ID from session:', authResult.userId);
      this.loggingService.debug('[API_KEY_ROUTE] User email from session:', authResult.email);
      
      // Get the user's database record using the numeric ID
      const userData = await this.userDataAccess.getUserById(parseInt(authResult.userId!));
      
      if (!userData) {
        this.loggingService.debug(`[API_KEY_ROUTE] User not found in database: ${authResult.userId}`);
        return {
          success: false,
          error: 'User not found',
          message: 'User account not found. Please contact support.'
        };
      }
      
      this.loggingService.debug(`[API_KEY_ROUTE] Found user in database with ID: ${userData.id}`);
      
      // Check if user already has an API key using the database user ID
      const existingApiKey = await this.apiKeyService.getApiKeyWithTier(userData.id);
      
      if (existingApiKey) {
        this.loggingService.debug('[API_KEY_ROUTE] User already has an API key');
        return {
          success: false,
          error: 'Conflict',
          message: 'User already has an API key'
        };
      }

      // Create API key with tier information based on user's subscription
      const newApiKey = await this.apiKeyService.createApiKeyWithTier(
        userData.id,
        authResult.email!
      );

      this.loggingService.debug('[API_KEY_ROUTE] Successfully created API key for user:', userData.id);

      return {
        success: true,
        data: newApiKey
      };

    } catch (error) {
      this.loggingService.error(`[API_KEY_ROUTE] Error in POST request: ${error}`);
      throw error;
    }
  }

}
