import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { CookieAuthorizerService } from "@/services/CookieAuthorizerService";
import { UsageTrackingService } from "@/services/UsageTrackingService";
import { LoggingService } from "@/services/LoggingService";
import { ApiKeyDataAccess } from "@/data-access/ApiKeyDataAccess";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);

  try {
    // Authenticate using cookie-based authentication
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userDbId = parseInt(authResult.userId!);
    
    // Get user's API key
    const apiKeyDataAccess = container.resolve(ApiKeyDataAccess);
    const apiKeyData = await apiKeyDataAccess.getApiKeyByUserId(userDbId);

    if (!apiKeyData) {
      return NextResponse.json(
        { error: "No API key found. Please create an API key first." },
        { status: 404 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Get usage statistics using the API key
    const usageTrackingService = container.resolve(UsageTrackingService);
    const usageStats = await usageTrackingService.getUsageStats(
      apiKeyData.apiKey, 
      userDbId.toString(), 
      days
    );

    // Get current rate limit info
    const rateLimitInfo = await usageTrackingService.checkRateLimit(
      apiKeyData.apiKey, 
      userDbId.toString()
    );

    const response = NextResponse.json({
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

    return response;

  } catch (error) {
    loggingService.error(`Error getting usage statistics: ${error}`);

    return NextResponse.json(
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
  }
}
