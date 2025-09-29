import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { ApiKeyDataAccess } from "@/services/data-access";
import type { LoggingService } from "@/services/LoggingService";

export interface ApiKeyAuthResult {
  success: boolean;
  userId?: string;
  email?: string;
  apiKey?: string;
  error?: string;
  message?: string;
}

@injectable()
export class ApiKeyAuthorizerService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("ApiKeyDataAccess") private apiKeyDataAccess: ApiKeyDataAccess,
  ) {}

  /**
   * Authorize a request using API key authentication
   * Looks for API key in Authorization header or query parameter
   */
  async authorizeRequest(request: NextRequest): Promise<ApiKeyAuthResult> {
    try {
      this.loggingService.debug('[API_KEY_AUTH] Starting API key authorization');

      // Try to get API key from Authorization header first
      let apiKey = this.extractApiKeyFromHeader(request);
      
      // If not found in header, try query parameter
      if (!apiKey) {
        apiKey = this.extractApiKeyFromQuery(request);
      }

      if (!apiKey) {
        this.loggingService.debug('[API_KEY_AUTH] No API key found in request');
        return {
          success: false,
          error: 'Missing API key',
          message: 'API key is required. Provide it in Authorization header or api_key query parameter.'
        };
      }

      this.loggingService.debug(`[API_KEY_AUTH] Validating API key: ${apiKey.substring(0, 10)}...`);

      // Validate the API key
      const apiKeyRecord = await this.apiKeyDataAccess.getApiKeyByKey(apiKey);

      if (!apiKeyRecord) {
        this.loggingService.debug(`[API_KEY_AUTH] Invalid API key: ${apiKey.substring(0, 10)}...`);
        return {
          success: false,
          error: 'Invalid API key',
          message: 'The provided API key is invalid or inactive.'
        };
      }

      if (!apiKeyRecord.isActive) {
        this.loggingService.debug(`[API_KEY_AUTH] Inactive API key: ${apiKey.substring(0, 10)}...`);
        return {
          success: false,
          error: 'Invalid API key',
          message: 'The provided API key is inactive.'
        };
      }

      // Update usage count
      await this.apiKeyDataAccess.updateUsageCount(apiKey);

      this.loggingService.debug(`[API_KEY_AUTH] Successfully authorized user: ${apiKeyRecord.userId}`);

      return {
        success: true,
        userId: apiKeyRecord.userId.toString(),
        email: apiKeyRecord.email,
        apiKey: apiKeyRecord.apiKey,
      };

    } catch (error) {
      this.loggingService.error('[API_KEY_AUTH] Error during API key authorization:', error);
      
      return {
        success: false,
        error: 'Authorization failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred during authorization'
      };
    }
  }

  /**
   * Extract API key from Authorization header
   * Supports both "Bearer <key>" and "ApiKey <key>" formats
   */
  private extractApiKeyFromHeader(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return null;
    }

    // Support both Bearer and ApiKey formats
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    const apiKeyMatch = authHeader.match(/^ApiKey\s+(.+)$/i);

    if (bearerMatch) {
      return bearerMatch[1];
    }

    if (apiKeyMatch) {
      return apiKeyMatch[1];
    }

    // If no prefix, assume it's just the API key
    return authHeader.trim();
  }

  /**
   * Extract API key from query parameters
   */
  private extractApiKeyFromQuery(request: NextRequest): string | null {
    const { searchParams } = new URL(request.url);
    return searchParams.get('api_key');
  }

  /**
   * Check if a request has API key authentication
   */
  hasApiKeyAuth(request: NextRequest): boolean {
    return !!(this.extractApiKeyFromHeader(request) || this.extractApiKeyFromQuery(request));
  }
}
