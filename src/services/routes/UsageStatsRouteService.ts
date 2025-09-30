import { injectable, inject } from "tsyringe";
import { NextRequest, NextResponse } from "next/server";
import { UsageTrackingService } from "../rate-limiting/UsageTrackingService";
import { LoggingService } from "../LoggingService";
import { ApiKeyDataAccess } from "../data-access/ApiKeyDataAccess";

export interface UsageStatsResponse {
  success: boolean;
  data?: {
    usageStats: unknown;
    rateLimitInfo: unknown;
    apiKey: string;
  };
  error?: string;
  message?: string;
  metadata?: {
    requestedAt: string;
    processingTimeMs: number;
  };
}

@injectable()
export class UsageStatsRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("UsageTrackingService") private usageTrackingService: UsageTrackingService,
    @inject("ApiKeyDataAccess") private apiKeyDataAccess: ApiKeyDataAccess,
  ) {}

  /**
   * Main entry point for usage stats route - handles all logic
   */
  async invokeV1(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
      this.loggingService.debug('[USAGE_STATS_ROUTE] Starting usage stats request');

      // Get user ID from middleware headers
      const userId = request.headers.get('x-user-id');

      if (!userId) {
        return this.createErrorResponse(
          'Authentication required',
          'Please log in to access usage statistics',
          startTime,
          401
        );
      }

      const userDbId = parseInt(userId);
      
      // Get user's API key
      const apiKeyData = await this.apiKeyDataAccess.getApiKeyByUserId(userDbId);

      if (!apiKeyData) {
        return this.createErrorResponse(
          'No API key found',
          'Please create an API key first',
          startTime,
          404
        );
      }

      // Get query parameters
      const { searchParams } = new URL(request.url);
      const days = parseInt(searchParams.get("days") || "30");

      // Get usage statistics using the API key
      const usageStats = await this.usageTrackingService.getUsageStats(
        apiKeyData.apiKey, 
        userDbId.toString(), 
        days
      );

      // Get current rate limit info
      const rateLimitInfo = await this.usageTrackingService.checkRateLimit(
        apiKeyData.apiKey, 
        userDbId.toString()
      );

      return NextResponse.json({
        success: true,
        data: {
          usageStats,
          rateLimitInfo,
          apiKey: apiKeyData.apiKey.substring(0, 10) + "...", // Masked API key
        },
        metadata: {
          requestedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      });

    } catch (error) {
      this.loggingService.error(`[USAGE_STATS_ROUTE] Error getting usage statistics: ${error}`);

      return this.createErrorResponse(
        'Failed to get usage statistics',
        error instanceof Error ? error.message : 'Unknown error',
        startTime,
        500
      );
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: string,
    message: string,
    startTime: number,
    status: number
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: error,
      message: message,
      metadata: {
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    }, { status });
  }
}
