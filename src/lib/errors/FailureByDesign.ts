/**
 * Standardized error types for expected business logic failures
 */
export enum ErrorType {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Custom error class for expected business logic failures
 * These are errors that are part of normal application flow and should be handled gracefully
 */
export class FailureByDesign extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(type: ErrorType, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'FailureByDesign';
    this.type = type;
    this.details = details;
    
    // Map error types to HTTP status codes
    this.statusCode = this.getStatusCodeForType(type);
  }

  private getStatusCodeForType(type: ErrorType): number {
    switch (type) {
      case ErrorType.UNAUTHORIZED:
        return 401;
      case ErrorType.FORBIDDEN:
        return 403;
      case ErrorType.NOT_FOUND:
        return 404;
      case ErrorType.BAD_REQUEST:
        return 400;
      case ErrorType.CONFLICT:
        return 409;
      case ErrorType.VALIDATION_ERROR:
        return 422;
      case ErrorType.RATE_LIMITED:
        return 429;
      case ErrorType.PAYMENT_REQUIRED:
        return 402;
      case ErrorType.SERVICE_UNAVAILABLE:
        return 503;
      default:
        return 500;
    }
  }

  /**
   * Create a standardized error response object
   */
  toResponse(): {
    success: false;
    error: string;
    message: string;
    type: ErrorType;
    details?: Record<string, unknown>;
    timestamp: string;
  } {
    return {
      success: false,
      error: this.type,
      message: this.message,
      type: this.type,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Static factory methods for common error types
   */
  static unauthorized(message: string = 'Authentication required', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.UNAUTHORIZED, message, details);
  }

  static forbidden(message: string = 'Access denied', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.FORBIDDEN, message, details);
  }

  static notFound(message: string = 'Resource not found', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.NOT_FOUND, message, details);
  }

  static badRequest(message: string = 'Invalid request', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.BAD_REQUEST, message, details);
  }

  static conflict(message: string = 'Resource conflict', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.CONFLICT, message, details);
  }

  static validationError(message: string = 'Validation failed', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.VALIDATION_ERROR, message, details);
  }

  static rateLimited(message: string = 'Rate limit exceeded', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.RATE_LIMITED, message, details);
  }

  static paymentRequired(message: string = 'Payment required', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.PAYMENT_REQUIRED, message, details);
  }

  static serviceUnavailable(message: string = 'Service temporarily unavailable', details?: Record<string, unknown>): FailureByDesign {
    return new FailureByDesign(ErrorType.SERVICE_UNAVAILABLE, message, details);
  }
}

