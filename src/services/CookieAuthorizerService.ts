import { injectable, inject } from "tsyringe";
import { SessionManager } from "@/lib/SessionManager";
import type { LoggingService } from "./LoggingService";

export interface CookieAuthResult {
  success: boolean;
  userId?: string; // This is now the numeric database ID as a string
  email?: string;
  name?: string;
  provider?: string;
  providerId?: string;
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
   */
  async authorizeRequest(): Promise<CookieAuthResult> {
    try {
      this.loggingService.debug('[COOKIE_AUTH] Starting cookie authorization');

      // Get session data from cookies
      const sessionData = await SessionManager.getSessionFromCookies();

      if (!sessionData) {
        this.loggingService.debug('[COOKIE_AUTH] No session found in cookies');
        return {
          success: false,
          error: 'Not authenticated',
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
  async getCurrentUser(): Promise<CookieAuthResult> {
    return this.authorizeRequest();
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
    return SessionManager.createSession(sessionData);
  }

  /**
   * Clear the session cookie
   */
  async clearSession(): Promise<void> {
    await SessionManager.clearSessionCookie();
  }
}
