import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { SecParserService } from "@/services/SecParserService";
import { LoggingService } from "@/services/LoggingService";
import { RateLimitMiddleware } from "@/middleware/RateLimitMiddleware";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cik: string; accession: string; filename: string }> }
) {
  const startTime = Date.now();
  const loggingService = container.resolve(LoggingService);
  let rateLimitResult: any = null;

  try {
    // Await params before using them
    const { cik, accession, filename } = await params;
    
    loggingService.debug(`[FILING_API] Starting request for CIK: ${cik}, Accession: ${accession}, Filename: ${filename}`);
    
    // Check rate limits first (now uses subscription-based limits)
    rateLimitResult = await RateLimitMiddleware.checkRateLimit(request, {
      trackUsage: true,
    });

    if (!rateLimitResult.allowed) {
      loggingService.debug(`[FILING_API] Rate limit exceeded, returning error response`);
      return rateLimitResult.response!;
    }

    loggingService.debug(`[FILING_API] Rate limit check passed`);

    if (!cik || !accession || !filename) {
      loggingService.debug(`[FILING_API] Missing required parameters`);
      return NextResponse.json(
        { error: "Missing required path parameters: cik, accession, or filename" },
        { status: 400 }
      );
    }

    loggingService.debug(`[FILING_API] Parameters validated, starting SEC parsing`);

    // Validate that the filename ends with .json
    if (!filename.endsWith('.json')) {
      return NextResponse.json(
        { error: "Filename must end with .json" },
        { status: 400 }
      );
    }

    // Construct the filing path in the hierarchical format for SEC lookup
    // Convert filename from .json to .txt for SEC lookup
    const secFilename = filename.replace('.json', '.txt');
    const filingPath = `${cik}/${accession}/${secFilename}`;

    loggingService.debug(`Processing SEC filing: ${filingPath}`);

    // Parse the SEC filing
    loggingService.debug(`[FILING_API] Resolving SecParserService`);
    const secParserService = container.resolve(SecParserService);
    loggingService.debug(`[FILING_API] Starting SEC parsing for filing path: ${filingPath}`);
    const parsedDocument = await secParserService.parseSecFiling(filingPath);
    loggingService.debug(`[FILING_API] SEC parsing completed successfully`);

    const response = NextResponse.json({
      success: true,
      data: parsedDocument,
      metadata: {
        filingPath,
        cik,
        accession,
        filename,
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
