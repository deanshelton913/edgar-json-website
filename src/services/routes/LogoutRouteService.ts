import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { LoggingService } from "../LoggingService";

export interface LogoutResult {
  success: boolean;
  error?: string;
}

@injectable()
export class LogoutRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
  ) {}

  /**
   * Main entry point for logout route - handles all logic
   */
  async postInvokeV1(request: NextRequest): Promise<LogoutResult> {
    try {
      this.loggingService.debug('[LOGOUT_ROUTE] Logout request received');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[LOGOUT_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);
      
      await this.cookieAuthorizer.clearSession();
      
      this.loggingService.debug('[LOGOUT_ROUTE] Session cleared successfully');
      
      return { success: true };

    } catch (error) {
      this.loggingService.error('[LOGOUT_ROUTE] Logout error:', error);
      throw error;
    }
  }
}