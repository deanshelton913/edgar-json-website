import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { SecParserService } from "@/services/SecParserService";
import { LoggingService } from "@/services/LoggingService";
import { RateLimitMiddleware } from "@/middleware/RateLimitMiddleware";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);

  try {
    // Check rate limits first (now uses subscription-based limits)
    const rateLimitResponse = await RateLimitMiddleware.checkRateLimit(request, {
      trackUsage: true,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Extract filing path from query parameters
    const { searchParams } = new URL(request.url);
    const filingPath = searchParams.get("path");

    if (!filingPath) {
      return NextResponse.json(
        { error: "Missing filing path parameter" },
        { status: 400 }
      );
    }

    loggingService.debug(`Processing filing: ${filingPath}`);

    // Parse the SEC filing
    const secParserService = container.resolve(SecParserService);
    const parsedDocument = await secParserService.parseSecFiling(filingPath);

    const response = NextResponse.json({
      success: true,
      data: parsedDocument,
      metadata: {
        filingPath,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    });

    // Track usage after successful response
    await RateLimitMiddleware.trackUsage(request, response, startTime, "/api/parse");

    return response;

  } catch (error) {
    loggingService.error(`Error parsing SEC filing: ${error}`);

    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Failed to parse SEC filing",
        message: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 500 }
    );

    // Track usage even for failed requests
    await RateLimitMiddleware.trackUsage(request, errorResponse, startTime, "/api/parse");

    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);

  try {
    // Check rate limits first (now uses subscription-based limits)
    const rateLimitResponse = await RateLimitMiddleware.checkRateLimit(request, {
      trackUsage: true,
    });

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { testMode, filingPath } = body;

    if (testMode) {
      const response = NextResponse.json({
        success: true,
        message: 'SEC Parser Service is working!',
        data: {
          services: [
            'LoggingService',
            'HttpService', 
            'FormFactoryService',
            'GenericSecParsingService',
            'ParserService',
            'UueCodecService',
            'UserApiKeyService',
            'UsageTrackingService'
          ],
          status: 'All services loaded successfully'
        },
        metadata: {
          timestamp: new Date().toISOString(),
          testMode: true
        }
      });

      // Track usage for test requests too
      await RateLimitMiddleware.trackUsage(request, response, startTime, "/api/parse");

      return response;
    }

    if (!filingPath) {
      return NextResponse.json(
        { error: "Missing filingPath in request body" },
        { status: 400 }
      );
    }

    loggingService.debug(`Processing filing via POST: ${filingPath}`);

    // Parse the SEC filing
    const secParserService = container.resolve(SecParserService);
    const parsedDocument = await secParserService.parseSecFiling(filingPath);

    const response = NextResponse.json({
      success: true,
      data: parsedDocument,
      metadata: {
        filingPath,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
      },
    });

    // Track usage after successful response
    await RateLimitMiddleware.trackUsage(request, response, startTime, "/api/parse");

    return response;

  } catch (error) {
    loggingService.error(`Error parsing SEC filing via POST: ${error}`);

    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Failed to parse SEC filing",
        message: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          processedAt: new Date().toISOString(),
          processingTimeMs: Date.now() - startTime,
        },
      },
      { status: 500 }
    );

    // Track usage even for failed requests
    await RateLimitMiddleware.trackUsage(request, errorResponse, startTime, "/api/parse");

    return errorResponse;
  }
}

