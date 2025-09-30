import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container-server";
import { SecParserService } from "@/services/parsing/SecParserService";
import { LoggingService } from "@/services/LoggingService";
import { RateLimitMiddleware, RateLimitResult } from "@/middleware/RateLimitMiddleware";
import { withRedisRouteHandlerJson } from "@/lib/route-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cik: string; accession: string; filename: string }> }
) {
  return withRedisRouteHandlerJson(
    request,
    'FILING_INDIVIDUAL_ROUTE',
    async (req) => {
      const startTime = Date.now();
      const loggingService = container.resolve(LoggingService);
      let rateLimitResult: RateLimitResult | null = null;

      // Await params before using them
      const { cik, accession, filename } = await params;
      
      loggingService.debug(`[FILING_API] Starting request for CIK: ${cik}, Accession: ${accession}, Filename: ${filename}`);
      
      // Check rate limits first (now uses subscription-based limits)
      rateLimitResult = await RateLimitMiddleware.checkRateLimit(req, {
        trackUsage: true,
      });

      if (!rateLimitResult.allowed) {
        loggingService.debug(`[FILING_API] Rate limit exceeded, returning error response`);
        throw new Error(`Rate limit exceeded: ${rateLimitResult.response?.statusText}`);
      }

      loggingService.debug(`[FILING_API] Rate limit check passed`);

      if (!cik || !accession || !filename) {
        loggingService.debug(`[FILING_API] Missing required parameters`);
        throw new Error("Missing required path parameters: cik, accession, or filename");
      }

      loggingService.debug(`[FILING_API] Parameters validated, starting SEC parsing`);

      // Validate that the filename ends with .json
      if (!filename.endsWith('.json')) {
        throw new Error("Filename must end with .json");
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

      const result = {
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
      };

      // Track usage after successful response
      if (rateLimitResult && rateLimitResult.apiKey && rateLimitResult.userId) {
        const response = NextResponse.json(result);
        await RateLimitMiddleware.trackUsage(rateLimitResult.apiKey, rateLimitResult.userId, response, startTime, "/api/v1/filings");
      }

      return result;
    }
  );
}
