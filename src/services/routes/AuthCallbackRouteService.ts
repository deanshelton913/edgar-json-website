import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { GoogleAuthenticationService } from "../authorizers/GoogleAuthenticationService";
import { LoggingService } from "../LoggingService";

export interface AuthCallbackResult {
  success: boolean;
  redirectUrl?: string;
  sessionData?: {
    userId: string;
    googleId: string;
    email: string;
    name: string;
    provider: string;
    providerId: string;
  };
  error?: string;
}

@injectable()
export class AuthCallbackRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("GoogleAuthenticationService") private googleAuthService: GoogleAuthenticationService,
  ) {}

  /**
   * Main entry point for auth callback route - handles Google OAuth callback
   */
  async getInvokeV1(request: NextRequest): Promise<AuthCallbackResult> {
    try {
      this.loggingService.debug('[AUTH_CALLBACK_ROUTE] Starting callback processing');
      this.loggingService.debug('[AUTH_CALLBACK_ROUTE] Request URL:', request.url);
      this.loggingService.debug('[AUTH_CALLBACK_ROUTE] Search params:', new URL(request.url).searchParams.toString());
      
      const result = await this.googleAuthService.processGoogleCallback(request);

      this.loggingService.debug('[AUTH_CALLBACK_ROUTE] Auth result:', result);

      if (!result.success) {
        this.loggingService.debug('[AUTH_CALLBACK_ROUTE] Auth failed, redirecting to:', result.redirectUrl);
        return {
          success: false,
          redirectUrl: result.redirectUrl,
          error: result.error
        };
      }

      this.loggingService.debug('[AUTH_CALLBACK_ROUTE] Auth successful');
      return {
        success: true,
        redirectUrl: result.redirectUrl,
        sessionData: result.sessionData
      };

    } catch (error) {
      this.loggingService.error('[AUTH_CALLBACK_ROUTE] Callback error:', error);
      this.loggingService.error('[AUTH_CALLBACK_ROUTE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      return {
        success: false,
        redirectUrl: '/?error=callback_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create authenticated response with session cookie
   */
  async createAuthenticatedResponse(
    sessionData: {
      userId: string;
      googleId: string;
      email: string;
      name: string;
      provider: string;
      providerId: string;
    },
    redirectUrl: string,
    request: NextRequest
  ) {
    return await this.googleAuthService.createAuthenticatedResponse(sessionData, redirectUrl, request);
  }
}
