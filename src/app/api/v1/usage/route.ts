import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { UsageTrackingService } from "@/services/UsageTrackingService";
import { LoggingService } from "@/services/LoggingService";
import { RateLimitMiddleware } from "@/middleware/RateLimitMiddleware";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);

  try {
    // Check rate limits first
    const rateLimitResponse = await RateLimitMiddleware.checkRateLimit(request, {
      requestsPerMinute: 5, // Lower limit for stats endpoint
      requestsPerDay: 50,
      trackUsage: true,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
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
    await RateLimitMiddleware.trackUsage(request, response, startTime, "/api/v1/usage");

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
    await RateLimitMiddleware.trackUsage(request, errorResponse, startTime, "/api/v1/usage");

    return errorResponse;
  }
}

