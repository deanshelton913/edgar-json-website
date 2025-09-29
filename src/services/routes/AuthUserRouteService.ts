import { injectable, inject } from "tsyringe";
import { NextRequest, NextResponse } from 'next/server';
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { LoggingService } from "../LoggingService";

export interface AuthUserResponse {
  authenticated: boolean;
  user?: {
    userId: string;
    email: string;
    name: string;
    provider: string;
  };
}

@injectable()
export class AuthUserRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
  ) {}

  /**
   * GET method for auth user route
   */
  async getInvokeV1(request: NextRequest): Promise<AuthUserResponse> {
    try {
      this.loggingService.debug('[AUTH_USER_ROUTE] Getting user info from session...');
      
      // Debug: Log all cookies
      const cookies = request.cookies.getAll();
      this.loggingService.debug('[AUTH_USER_ROUTE] All cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
      
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);

      if (!authResult.success) {
        this.loggingService.debug('[AUTH_USER_ROUTE] Authentication failed:', authResult.error);
        return { authenticated: false };
      }

      this.loggingService.debug('[AUTH_USER_ROUTE] Session data found:', authResult);
      
      return {
        authenticated: true,
        user: {
          userId: authResult.userId!,
          email: authResult.email!,
          name: authResult.name!,
          provider: authResult.provider!,
        },
      };

    } catch (error) {
      this.loggingService.error('[AUTH_USER_ROUTE] Get user info error:', error);
      return { authenticated: false };
    }
  }
}
