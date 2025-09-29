import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { LoggingService } from '@/services/LoggingService';
import { initializeRedisForRoute, cleanupRedisForRoute } from '@/lib/redis';

/**
 * Centralized route handler that manages Redis connections and error handling
 * Use this for all API routes that need Redis access
 */
export async function withRedisRouteHandler<T>(
  request: NextRequest,
  routeName: string,
  handler: (request: NextRequest) => Promise<T>
): Promise<NextResponse> {
  const loggingService = container.resolve<LoggingService>("LoggingService");
  
  try {
    loggingService.info(`[ROUTE_HANDLER] Starting ${routeName} route`);
    
    // Initialize Redis connection for this route
    await initializeRedisForRoute();
    
    // Execute the route handler
    const result = await handler(request);
    
    loggingService.info(`[ROUTE_HANDLER] ${routeName} route completed successfully`);
    
    // Return the result (could be NextResponse or data)
    if (result instanceof NextResponse) {
      return result;
    } else {
      return NextResponse.json(result);
    }
    
  } catch (error) {
    loggingService.error(`[ROUTE_HANDLER] Error in ${routeName} route:`, error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: error.message,
          metadata: {
            timestamp: new Date().toISOString(),
            route: routeName
          }
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        {
          error: 'Internal server error',
          message: 'Unknown error',
          metadata: {
            timestamp: new Date().toISOString(),
            route: routeName
          }
        },
        { status: 500 }
      );
    }
  } finally {
    // Always cleanup Redis connection
    try {
      await cleanupRedisForRoute();
      loggingService.info(`[ROUTE_HANDLER] ${routeName} route cleanup completed`);
    } catch (cleanupError) {
      loggingService.error(`[ROUTE_HANDLER] Error during ${routeName} cleanup:`, cleanupError);
    }
  }
}

/**
 * Simplified route handler for routes that return JSON data
 */
export async function withRedisRouteHandlerJson<T>(
  request: NextRequest,
  routeName: string,
  handler: (request: NextRequest) => Promise<T>
): Promise<NextResponse> {
  return withRedisRouteHandler(request, routeName, async (req) => {
    const data = await handler(req);
    return NextResponse.json(data);
  });
}

/**
 * Route handler for routes that return NextResponse directly
 */
export async function withRedisRouteHandlerResponse(
  request: NextRequest,
  routeName: string,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  return withRedisRouteHandler(request, routeName, handler);
}
