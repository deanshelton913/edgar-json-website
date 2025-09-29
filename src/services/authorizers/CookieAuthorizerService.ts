import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { SessionManager, SessionData } from "@/lib/SessionManager";
import { CredentialCachingService } from "@/services/CredentialCachingService";
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
    @inject("CredentialCachingService") private credentialCache: CredentialCachingService,
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

      // First try to get session data from Redis cache
      const sessionData = await this.getSessionFromCache();
      
      if (!sessionData) {
        // Fallback to cookie-based session
        const cookieSessionData = await SessionManager.getSessionFromCookies();
        
        if (!cookieSessionData) {
          this.loggingService.debug('[COOKIE_AUTH] No session found in cookies or cache');
          return {
            success: false,
            error: 'Not authenticated',
            message: 'Please log in to access this resource.'
          };
        }

        // Cache the session data for future requests
        await this.credentialCache.cacheUserSession(
          `cookie_${cookieSessionData.userId}`,
          cookieSessionData as unknown as Record<string, unknown>,
          86400 // 24 hours
        );

        this.loggingService.debug(`[COOKIE_AUTH] Successfully authorized user from cookie: ${cookieSessionData.userId}`);

        return {
          success: true,
          userId: cookieSessionData.userId,
          email: cookieSessionData.email,
          name: cookieSessionData.name,
          provider: cookieSessionData.provider,
          providerId: cookieSessionData.providerId,
        };
      }

      // Type guard to ensure sessionData has the required properties
      const typedSessionData = sessionData as SessionData;
      
      this.loggingService.debug(`[COOKIE_AUTH] Successfully authorized user from cache: ${typedSessionData.userId}`);

      return {
        success: true,
        userId: typedSessionData.userId,
        email: typedSessionData.email,
        name: typedSessionData.name,
        provider: typedSessionData.provider,
        providerId: typedSessionData.providerId,
        googleId: typedSessionData.googleId,
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
  async hasCookieAuth(): Promise<boolean> {
    try {
      // Check cache first
      const cachedSession = await this.getSessionFromCache();
      if (cachedSession) {
        return true;
      }

      // Fallback to cookie check
      const sessionData = await SessionManager.getSessionFromCookies();
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
    
    // Cache the session data
    await this.credentialCache.cacheUserSession(
      `cookie_${sessionData.userId}`,
      sessionData as unknown as Record<string, unknown>,
      86400 // 24 hours
    );

    return token;
  }

  /**
   * Clear the session cookie and cache
   */
  async clearSession(): Promise<void> {
    try {
      // Get current session to clear cache
      const sessionData = await SessionManager.getSessionFromCookies();
      if (sessionData) {
        await this.credentialCache.invalidateUserSession(`cookie_${sessionData.userId}`);
      }

      // Clear cookie
      await SessionManager.clearSessionCookie();
      
      this.loggingService.debug('[COOKIE_AUTH] Session cleared from cookie and cache');
    } catch (error) {
      this.loggingService.error('[COOKIE_AUTH] Error clearing session:', error);
      throw error;
    }
  }

  /**
   * Get session data from cache
   */
  private async getSessionFromCache(): Promise<SessionData | null> {
    try {
      // Try to get session from cache using a pattern
      // This is a simplified approach - in a real implementation you might want to store session IDs differently
      const sessionData = await SessionManager.getSessionFromCookies();
      if (sessionData) {
        const cachedData = await this.credentialCache.getCachedUserSession(`cookie_${sessionData.userId}`);
        if (cachedData && this.isValidSessionData(cachedData)) {
          return cachedData as SessionData;
        }
      }
      return null;
    } catch (error) {
      this.loggingService.error('[COOKIE_AUTH] Error getting session from cache:', error);
      return null;
    }
  }

  /**
   * Type guard to validate session data structure
   */
  private isValidSessionData(data: unknown): data is SessionData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as Record<string, unknown>).userId === 'string' &&
      typeof (data as Record<string, unknown>).googleId === 'string' &&
      typeof (data as Record<string, unknown>).email === 'string' &&
      typeof (data as Record<string, unknown>).name === 'string' &&
      typeof (data as Record<string, unknown>).provider === 'string' &&
      typeof (data as Record<string, unknown>).providerId === 'string'
    );
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

      // Cache the validated session
      await this.credentialCache.cacheUserSession(
        `cookie_${sessionData.userId}`,
        sessionData as unknown as Record<string, unknown>,
        86400 // 24 hours
      );

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