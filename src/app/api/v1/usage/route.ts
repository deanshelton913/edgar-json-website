import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { UsageTrackingService } from "@/services/rate-limiting/UsageTrackingService";
import { LoggingService } from "@/services/LoggingService";
import { RateLimitMiddleware, RateLimitResult } from "@/middleware/RateLimitMiddleware";
import { withRedisRouteHandlerJson } from "@/lib/route-handler";

export async function GET(request: NextRequest) {
  return withRedisRouteHandlerJson(
    request,
    'V1_USAGE_ROUTE',
    async (req) => {
      const startTime = Date.now();
      const loggingService = container.resolve(LoggingService);
      let rateLimitResult: RateLimitResult | null = null;

      // Check rate limits first
      rateLimitResult = await RateLimitMiddleware.checkRateLimit(req, {
        trackUsage: true,
      });

      if (!rateLimitResult.allowed) {
        throw new Error(`Rate limit exceeded: ${rateLimitResult.response?.statusText}`);
      }

      // Extract API key from headers
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Missing or invalid Authorization header");
      }

      const apiKey = authHeader.substring(7);
      const userId = req.headers.get("x-user-id");

      if (!userId) {
        throw new Error("User ID not found in request");
      }

      // Get query parameters
      const { searchParams } = new URL(req.url);
      const days = parseInt(searchParams.get("days") || "30");

      // Get usage statistics
      const usageTrackingService = container.resolve(UsageTrackingService);
      const usageStats = await usageTrackingService.getUsageStats(apiKey, userId, days);

      // Get current rate limit info
      const rateLimitInfo = await usageTrackingService.checkRateLimit(apiKey, userId);

      const result = {
        success: true,
        data: {
          usageStats,
          rateLimitInfo,
          apiKey: apiKey.substring(0, 10) + "...", // Masked API key
        },
        metadata: {
          requestedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      };

      // Track usage
      if (rateLimitResult && rateLimitResult.apiKey && rateLimitResult.userId) {
        const response = NextResponse.json(result);
        await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, response, startTime, "/api/v1/usage");
      }

      return result;
    }
  );
}

