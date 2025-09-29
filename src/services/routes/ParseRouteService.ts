import { injectable, inject } from "tsyringe";
import { NextRequest, NextResponse } from "next/server";
import { SecParserService } from "../parsing/SecParserService";
import { LoggingService } from "../LoggingService";
import { UsageTrackingService } from "../rate-limiting/UsageTrackingService";
import { ApiKeyAuthorizerService } from "../authorizers/ApiKeyAuthorizerService";

export interface ParseRequest {
  filingPath: string;
  testMode?: boolean;
}

export interface ParseResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
  metadata?: {
    filingPath?: string;
    processedAt: string;
    processingTimeMs: number;
    apiVersion: string;
    timestamp: string;
  };
}

@injectable()
export class ParseRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("SecParserService") private secParserService: SecParserService,
    @inject("UsageTrackingService") private usageTrackingService: UsageTrackingService,
    @inject("ApiKeyAuthorizerService") private apiKeyAuthorizer: ApiKeyAuthorizerService,
  ) {}

  /**
   * Main entry point for GET requests - parses SEC filing from query params
   */
  async getInvokeV1(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    let apiKey: string | null = null;
    let userId: string | null = null;
    let parseRequest: ParseRequest | null = null;

    try {
      this.loggingService.debug('[PARSE_ROUTE] Starting GET parse request');

      // Extract request data
      parseRequest = await this.extractGetRequestData(request);
      
      // Handle test mode
      if (parseRequest.testMode) {
        return this.handleTestMode(startTime);
      }

      // Validate required parameters
      if (!parseRequest.filingPath) {
        return this.createErrorResponse(
          'Missing filing path',
          'path parameter is required',
          startTime,
          400
        );
      }

      // Authorize request (if API key is provided)
      const authResult = await this.authorizeRequest(request);
      if (!authResult.success) {
        return this.createErrorResponse(
          'Authorization failed',
          authResult.message || 'Invalid API key',
          startTime,
          401
        );
      }

      apiKey = authResult.apiKey || null;
      userId = authResult.userId || null;

      // Check rate limits (if API key is provided)
      if (apiKey && userId) {
        const rateLimitResult = await this.usageTrackingService.checkRateLimit(apiKey, userId);
        if (rateLimitResult.isLimited) {
          return this.createErrorResponse(
            'Rate limit exceeded',
            `Rate limit exceeded. Try again at ${rateLimitResult.resetTimeMinute}`,
            startTime,
            429
          );
        }
      }

      this.loggingService.debug(`[PARSE_ROUTE] Processing filing: ${parseRequest.filingPath}`);

      // Parse the SEC filing
      const parsedDocument = await this.secParserService.parseSecFiling(parseRequest.filingPath);

      // Create successful response
      const response = this.createSuccessResponse(parsedDocument, parseRequest.filingPath, startTime);

      // Track usage (if API key is provided)
      if (apiKey && userId) {
        await this.trackUsage(apiKey, userId, response, startTime, '/api/parse');
      }

      return response;

    } catch (error) {
      this.loggingService.error(`[PARSE_ROUTE] Error parsing SEC filing: ${error}`);
      
      const errorResponse = this.createErrorResponse(
        'Parsing failed',
        error instanceof Error ? error.message : 'Unknown error',
        startTime,
        500,
        parseRequest?.filingPath
      );

      // Track usage even for failed requests
      if (apiKey && userId) {
        await this.trackUsage(apiKey, userId, errorResponse, startTime, '/api/parse');
      }

      return errorResponse;
    }
  }

  /**
   * Main entry point for POST requests - parses SEC filing from request body
   */
  async postInvokeV1(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    let apiKey: string | null = null;
    let userId: string | null = null;
    let parseRequest: ParseRequest | null = null;

    try {
      this.loggingService.debug('[PARSE_ROUTE] Starting POST parse request');

      // Extract request data
      parseRequest = await this.extractPostRequestData(request);
      
      // Handle test mode
      if (parseRequest.testMode) {
        return this.handleTestMode(startTime);
      }

      // Validate required parameters
      if (!parseRequest.filingPath) {
        return this.createErrorResponse(
          'Missing filing path',
          'filingPath parameter is required in request body',
          startTime,
          400
        );
      }

      // Authorize request (if API key is provided)
      const authResult = await this.authorizeRequest(request);
      if (!authResult.success) {
        return this.createErrorResponse(
          'Authorization failed',
          authResult.message || 'Invalid API key',
          startTime,
          401
        );
      }

      apiKey = authResult.apiKey || null;
      userId = authResult.userId || null;

      // Check rate limits (if API key is provided)
      if (apiKey && userId) {
        const rateLimitResult = await this.usageTrackingService.checkRateLimit(apiKey, userId);
        if (rateLimitResult.isLimited) {
          return this.createErrorResponse(
            'Rate limit exceeded',
            `Rate limit exceeded. Try again at ${rateLimitResult.resetTimeMinute}`,
            startTime,
            429
          );
        }
      }

      this.loggingService.debug(`[PARSE_ROUTE] Processing filing: ${parseRequest.filingPath}`);

      // Parse the SEC filing
      const parsedDocument = await this.secParserService.parseSecFiling(parseRequest.filingPath);

      // Create successful response
      const response = this.createSuccessResponse(parsedDocument, parseRequest.filingPath, startTime);

      // Track usage (if API key is provided)
      if (apiKey && userId) {
        await this.trackUsage(apiKey, userId, response, startTime, '/api/parse');
      }

      return response;

    } catch (error) {
      this.loggingService.error(`[PARSE_ROUTE] Error parsing SEC filing: ${error}`);
      
      const errorResponse = this.createErrorResponse(
        'Parsing failed',
        error instanceof Error ? error.message : 'Unknown error',
        startTime,
        500,
        parseRequest?.filingPath
      );

      // Track usage even for failed requests
      if (apiKey && userId) {
        await this.trackUsage(apiKey, userId, errorResponse, startTime, '/api/parse');
      }

      return errorResponse;
    }
  }

  /**
   * Extract request data from GET request
   */
  private async extractGetRequestData(request: NextRequest): Promise<ParseRequest> {
    const { searchParams } = new URL(request.url);
    return {
      filingPath: searchParams.get('path') || '',
      testMode: false,
    };
  }

  /**
   * Extract request data from POST request
   */
  private async extractPostRequestData(request: NextRequest): Promise<ParseRequest> {
    const body = await request.json();
    return {
      filingPath: body.filingPath || '',
      testMode: body.testMode || false,
    };
  }

  /**
   * Authorize the request
   */
  private async authorizeRequest(request: NextRequest): Promise<{
    success: boolean;
    apiKey?: string;
    userId?: string;
    message?: string;
  }> {
    try {
      // Check for API key in headers
      const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
      
      if (apiKey) {
        const authResult = await this.apiKeyAuthorizer.authorizeRequest(request);
        return {
          success: authResult.success,
          apiKey: authResult.apiKey,
          userId: authResult.userId,
          message: authResult.message,
        };
      }

      // No API key provided - allow request but don't track usage
      return { success: true };
    } catch (error) {
      this.loggingService.error(`[PARSE_ROUTE] Authorization error: ${error}`);
      return {
        success: false,
        message: 'Authorization failed',
      };
    }
  }

  /**
   * Handle test mode requests
   */
  private handleTestMode(startTime: number): NextResponse {
    return NextResponse.json({
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
          'UsageTrackingService'
        ],
        status: 'All services loaded successfully'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        testMode: true,
        processingTimeMs: Date.now() - startTime,
        apiVersion: 'v1',
        processedAt: new Date().toISOString(),
      }
    });
  }

  /**
   * Create success response
   */
  private createSuccessResponse(data: unknown, filingPath: string, startTime: number): NextResponse {
    return NextResponse.json({
      success: true,
      data: data,
      metadata: {
        filingPath,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        apiVersion: 'v1',
        timestamp: new Date().toISOString(),
      }
    });
  }

  /**
   * Create error response
   */
  private createErrorResponse(
    error: string,
    message: string,
    startTime: number,
    status: number,
    filingPath?: string
  ): NextResponse {
    return NextResponse.json({
      success: false,
      error: error,
      message: message,
      metadata: {
        filingPath: filingPath || null,
        processedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - startTime,
        apiVersion: 'v1',
        timestamp: new Date().toISOString(),
      }
    }, { status });
  }

  /**
   * Track usage for the request
   */
  private async trackUsage(
    apiKey: string,
    userId: string,
    response: NextResponse,
    startTime: number,
    endpoint: string
  ): Promise<void> {
    try {
      await this.usageTrackingService.trackUsage({
        apiKey,
        userId: parseInt(userId),
        endpoint,
        timestamp: new Date(),
        requestId: crypto.randomUUID(),
        responseStatus: response.status,
        processingTimeMs: Date.now() - startTime,
      });
    } catch (error) {
      this.loggingService.error(`[PARSE_ROUTE] Error tracking usage: ${error}`);
      // Don't throw - usage tracking failure shouldn't break the request
    }
  }
}
