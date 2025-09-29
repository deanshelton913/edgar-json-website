import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { SessionManager } from "@/lib/SessionManager";
import type { LoggingService } from "../LoggingService";

export interface CookieAuthResult {
  success: boolean;
  userId?: string; // This is now the numeric database ID as a string
  email?: string;
  name?: string;
  provider?: string;
  providerId?: string;
  googleId?: string;
  error?: string;
  message?: string;
}

@injectable()
export class CookieAuthorizerService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  /**
   * Authorize a request using session cookie authentication
   * This service ONLY handles session validation and authorization
   */
  async authorizeRequest(request: NextRequest): Promise<CookieAuthResult> {
    try {
      this.loggingService.debug('[COOKIE_AUTH] Starting cookie authorization');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[COOKIE_AUTH] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Get session cookie directly from request
      const sessionCookie = request.cookies.get(SessionManager.SESSION_COOKIE_NAME);
      
      if (!sessionCookie) {
        this.loggingService.debug('[COOKIE_AUTH] No session cookie found in request');
        return {
          success: false,
          error: 'Not authenticated',
          message: 'Please log in to access this resource.'
        };
      }

      // Verify the JWT token directly - no cache needed!
      const sessionData = await SessionManager.verifySession(sessionCookie.value);
      
      if (!sessionData) {
        this.loggingService.debug('[COOKIE_AUTH] Invalid or expired session token');
        return {
          success: false,
          error: 'Invalid session',
          message: 'Please log in to access this resource.'
        };
      }

      this.loggingService.debug(`[COOKIE_AUTH] Successfully authorized user: ${sessionData.userId}`);

      return {
        success: true,
        userId: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        provider: sessionData.provider,
        providerId: sessionData.providerId,
        googleId: sessionData.googleId,
      };

    } catch (error) {
      this.loggingService.error('[COOKIE_AUTH] Error during cookie authorization:', error);
      
      return {
        success: false,
        error: 'Authorization failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred during authorization'
      };
    }
  }

  /**
   * Check if a request has session cookie authentication
   */
  async hasCookieAuth(request: NextRequest): Promise<boolean> {
    try {
      const sessionCookie = request.cookies.get(SessionManager.SESSION_COOKIE_NAME);
      if (!sessionCookie) {
        return false;
      }

      const sessionData = await SessionManager.verifySession(sessionCookie.value);
      return !!sessionData;
    } catch (error) {
      this.loggingService.error('[COOKIE_AUTH] Error checking cookie auth:', error);
      return false;
    }
  }

  /**
   * Get current user info from session cookie
   */
  async getCurrentUser(request: NextRequest): Promise<CookieAuthResult> {
    try {
      const sessionCookie = request.cookies.get(SessionManager.SESSION_COOKIE_NAME);
      
      if (!sessionCookie) {
        return {
          success: false,
          error: 'No active session found'
        };
      }

      const sessionData = await SessionManager.verifySession(sessionCookie.value);
      if (!sessionData) {
        return {
          success: false,
          error: 'Invalid session'
        };
      }

      return {
        success: true,
        userId: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        provider: sessionData.provider,
        providerId: sessionData.providerId,
        googleId: sessionData.googleId,
      };
    } catch (error) {
      this.loggingService.error('[COOKIE_AUTH] Error getting current user:', error);
      return {
        success: false,
        error: 'Failed to get current user'
      };
    }
  }

  /**
   * Create a session cookie for a user
   */
  async createSession(sessionData: {
    userId: string;
    email: string;
    name: string;
    provider: string;
    providerId: string;
    googleId: string;
  }): Promise<string> {
    const token = await SessionManager.createSession(sessionData);
    return token;
  }

  /**
   * Clear the session cookie
   */
  async clearSession(): Promise<void> {
    try {
      await SessionManager.clearSessionCookie();
      this.loggingService.debug('[COOKIE_AUTH] Session cleared successfully');
    } catch (error) {
      this.loggingService.error('[COOKIE_AUTH] Error clearing session:', error);
      throw error;
    }
  }

  /**
   * Validate session token and return user data
   */
  async validateSessionToken(token: string): Promise<CookieAuthResult> {
    try {
      const sessionData = await SessionManager.verifySession(token);
      
      if (!sessionData) {
        return {
          success: false,
          error: 'Invalid session',
          message: 'Session token is invalid or expired'
        };
      }

      return {
        success: true,
        userId: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        provider: sessionData.provider,
        providerId: sessionData.providerId,
        googleId: sessionData.googleId,
      };
    } catch (error) {
      this.loggingService.error('[COOKIE_AUTH] Error validating session token:', error);
      return {
        success: false,
        error: 'Session validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}