import { NextResponse } from 'next/server';
import { FailureByDesign } from './FailureByDesign';

/**
 * Standardized error handler for route handlers
 * Handles FailureByDesign errors with appropriate HTTP status codes
 * All other errors return 500 Internal Server Error
 */
export function handleRouteError(error: unknown, context: string = 'Route handler'): NextResponse {
  console.error(`[${context}] Error:`, error);

  // Handle expected business logic failures
  if (error instanceof FailureByDesign) {
    return NextResponse.json(
      error.toResponse(),
      { status: error.statusCode }
    );
  }

  // Handle unexpected errors (500)
  return NextResponse.json(
    {
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Helper function to check if an error is a FailureByDesign error
 */
export function isFailureByDesign(error: unknown): error is FailureByDesign {
  return error instanceof FailureByDesign;
}

