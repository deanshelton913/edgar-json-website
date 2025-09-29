import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { UsageTrackingService } from "@/services/rate-limiting/UsageTrackingService";
import { LoggingService } from "@/services/LoggingService";
import { RateLimitMiddleware, RateLimitResult } from "@/middleware/RateLimitMiddleware";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);
  let rateLimitResult: RateLimitResult | null = null;

  try {
    // Check rate limits first
    rateLimitResult = await RateLimitMiddleware.checkRateLimit(request, {
      trackUsage: true,
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Extract API key from headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.substring(7);
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID not found in request" },
        { status: 400 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Get usage statistics
    const usageTrackingService = container.resolve(UsageTrackingService);
    const usageStats = await usageTrackingService.getUsageStats(apiKey, userId, days);

    // Get current rate limit info
    const rateLimitInfo = await usageTrackingService.checkRateLimit(apiKey, userId);

    const response = NextResponse.json({
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
    });

    // Track usage
    if (rateLimitResult && rateLimitResult.apiKey && rateLimitResult.userId) {
      await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, response, startTime, "/api/v1/usage");
    }

    return response;

  } catch (error) {
    loggingService.error(`Error getting usage statistics: ${error}`);

    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Failed to get usage statistics",
        message: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 500 }
    );

    // Track usage even for failed requests
    if (rateLimitResult && rateLimitResult.apiKey && rateLimitResult.userId) {
      await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, errorResponse, startTime, "/api/v1/usage");
    }

    return errorResponse;
  }
}

