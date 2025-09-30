import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container-server";
import { UsageTrackingService } from "@/services/rate-limiting/UsageTrackingService";
import { ApiKeyAuthorizerService } from "@/services/authorizers/ApiKeyAuthorizerService";
import { LoggingService } from "@/services/LoggingService";

export interface RateLimitResult {
  allowed: boolean;
  response?: NextResponse;
  apiKey?: string;
  userId?: string;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  trackUsage: boolean;
}

export class RateLimitMiddleware {
  private static defaultConfig: RateLimitConfig = {
    requestsPerMinute: 10,
    requestsPerDay: 100,
    trackUsage: true,
  };

  /**
   * Middleware function to check rate limits and track usage
   */
  public static async checkRateLimit(
    request: NextRequest,
    config: Partial<RateLimitConfig> = {}
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    try {
      const usageTrackingService = container.resolve(UsageTrackingService);
      const apiKeyAuthorizerService = container.resolve(ApiKeyAuthorizerService);
      const loggingService = container.resolve(LoggingService);

      // Extract API key from Authorization header
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
          allowed: false,
          response: NextResponse.json(
            { error: "Missing or invalid Authorization header" },
            { status: 401 }
          )
        };
      }

      const apiKey = authHeader.substring(7); // Remove "Bearer " prefix
      
      // Validate API key and get user info
      const authResult = await apiKeyAuthorizerService.authorizeRequest(request);
      if (!authResult.success) {
        return {
          allowed: false,
          response: NextResponse.json(
            { error: authResult.message || "Invalid or inactive API key" },
            { status: 401 }
          )
        };
      }

      // Check rate limits using subscription-based limits
      const rateLimitInfo = await usageTrackingService.checkRateLimit(apiKey, authResult.userId!);
      
      if (rateLimitInfo.isLimited) {
        loggingService.warn(`Rate limit exceeded for API key: ${apiKey}`);
        
        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: "Rate limit exceeded",
              message: "You have exceeded your rate limit. Please try again later.",
              rateLimitInfo: {
                requestsPerMinute: rateLimitInfo.requestsPerMinute,
                requestsPerDay: rateLimitInfo.requestsPerDay,
                currentMinuteCount: rateLimitInfo.currentMinuteCount,
                currentDayCount: rateLimitInfo.currentDayCount,
                resetTimeMinute: rateLimitInfo.resetTimeMinute,
                resetTimeDay: rateLimitInfo.resetTimeDay,
              },
            },
            { 
              status: 429,
              headers: {
                "Retry-After": "60", // Retry after 1 minute
                "X-RateLimit-Limit-Minute": rateLimitInfo.requestsPerMinute.toString(),
                "X-RateLimit-Limit-Day": rateLimitInfo.requestsPerDay.toString(),
                "X-RateLimit-Remaining-Minute": Math.max(0, rateLimitInfo.requestsPerMinute - rateLimitInfo.currentMinuteCount).toString(),
                "X-RateLimit-Remaining-Day": Math.max(0, rateLimitInfo.requestsPerDay - rateLimitInfo.currentDayCount).toString(),
                "X-RateLimit-Reset-Minute": rateLimitInfo.resetTimeMinute,
                "X-RateLimit-Reset-Day": rateLimitInfo.resetTimeDay,
              },
            }
          )
        };
      }

      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Rate limit check passed - API key: ${apiKey.substring(0, 10)}..., User ID: ${authResult.userId}, Track usage: ${finalConfig.trackUsage}`);

      return {
        allowed: true,
        apiKey: finalConfig.trackUsage ? apiKey : undefined,
        userId: finalConfig.trackUsage ? authResult.userId : undefined
      };
    } catch (error) {
      const loggingService = container.resolve(LoggingService);
      loggingService.error(`Rate limit middleware error: ${error}`);
      
      return {
        allowed: false,
        response: NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        )
      };
    }
  }

  /**
   * Track API usage after request completion
   */
  public static async trackUsage(
    apiKey: string,
    userId: string,
    response: NextResponse,
    startTime: number,
    endpoint: string
  ): Promise<void> {
    try {
      const loggingService = container.resolve(LoggingService);
      
      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Tracking usage for API key: ${apiKey.substring(0, 10)}...`);
      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] User ID: ${userId}`);
      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Endpoint: ${endpoint}`);
      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Response status: ${response.status}`);

      const usageTrackingService = container.resolve(UsageTrackingService);
      const processingTime = Date.now() - startTime;

      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Processing time: ${processingTime}ms`);

      const userIdNumber = parseInt(userId, 10);
      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Parsed user ID: ${userIdNumber}`);

      const requestId = crypto.randomUUID();
      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Generated request ID: ${requestId}`);

      const usageRecord = {
        apiKey,
        userId: userIdNumber,
        endpoint,
        timestamp: new Date(),
        requestId,
        responseStatus: response.status,
        processingTimeMs: processingTime,
      };

      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Usage record: ${JSON.stringify(usageRecord, null, 2)}`);

      await usageTrackingService.trackUsage(usageRecord);
      
      loggingService.debug(`[RATE_LIMIT_MIDDLEWARE] Usage tracked successfully`);
    } catch (error) {
      const loggingService = container.resolve(LoggingService);
      loggingService.error(`[RATE_LIMIT_MIDDLEWARE] Error tracking usage: ${error}`);
      loggingService.error(`[RATE_LIMIT_MIDDLEWARE] Error stack: ${error instanceof Error ? error.stack : 'No stack trace'}`);
      // Don't throw - usage tracking failure shouldn't break the API
    }
  }
}
