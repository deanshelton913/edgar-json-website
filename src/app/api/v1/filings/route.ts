import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { SecParserService } from "@/services/SecParserService";
import { LoggingService } from "@/services/LoggingService";
import { RateLimitMiddleware } from "@/middleware/RateLimitMiddleware";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);
  let rateLimitResult: any = null;

  try {
    // Check rate limits first (now uses subscription-based limits)
    rateLimitResult = await RateLimitMiddleware.checkRateLimit(request, {
      trackUsage: true,
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
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
    if (rateLimitResult.apiKey && rateLimitResult.userId) {
      await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, response, startTime, "/api/v1/filings");
    }

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
    if (rateLimitResult.apiKey && rateLimitResult.userId) {
      await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, errorResponse, startTime, "/api/v1/filings");
    }

    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);
  let rateLimitResult: any = null;

  try {
    // Check rate limits first (now uses subscription-based limits)
    rateLimitResult = await RateLimitMiddleware.checkRateLimit(request, {
      trackUsage: true,
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
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
      if (rateLimitResult.apiKey && rateLimitResult.userId) {
        await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, response, startTime, "/api/v1/filings");
      }

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
    if (rateLimitResult.apiKey && rateLimitResult.userId) {
      await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, response, startTime, "/api/v1/filings");
    }

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
    if (rateLimitResult.apiKey && rateLimitResult.userId) {
      await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, errorResponse, startTime, "/api/v1/filings");
    }

    return errorResponse;
  }
}

