import { injectable, inject } from "tsyringe";
import { NextRequest, NextResponse } from "next/server";
import { UserDataAccess, TosDataAccess } from "@/data-access";
import { SessionManager } from "@/lib/SessionManager";
import type { LoggingService } from "./LoggingService";

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export interface SessionData {
  userId: string;
  googleId: string;
  email: string;
  name: string;
  provider: string;
  providerId: string;
}

export interface AuthResult {
  success: boolean;
  redirectUrl?: string;
  sessionData?: SessionData;
  error?: string;
}

@injectable()
export class AuthenticationService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("UserDataAccess") private userDataAccess: UserDataAccess,
    @inject("TosDataAccess") private tosDataAccess: TosDataAccess,
  ) {}

  /**
   * Process Google OAuth callback and handle user authentication
   */
  async processGoogleCallback(request: NextRequest): Promise<AuthResult> {
    try {
      this.loggingService.debug('[AUTH_SERVICE] Processing Google OAuth callback');

      const { searchParams } = new URL(request.url);
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      // Handle OAuth errors
      if (error) {
        this.loggingService.error('[AUTH_SERVICE] OAuth error:', error);
        return {
          success: false,
          redirectUrl: `/?error=${encodeURIComponent(error)}`,
          error: 'OAuth error'
        };
      }

      // Handle missing authorization code
      if (!code) {
        this.loggingService.error('[AUTH_SERVICE] No authorization code received');
        return {
          success: false,
          redirectUrl: '/?error=no_code',
          error: 'No authorization code'
        };
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code, request);
      if (!tokens) {
        return {
          success: false,
          redirectUrl: '/?error=token_exchange_failed',
          error: 'Token exchange failed'
        };
      }

      // Get user info from Google
      const userInfo = await this.getGoogleUserInfo(tokens.access_token);
      if (!userInfo) {
        return {
          success: false,
          redirectUrl: '/?error=user_info_failed',
          error: 'Failed to get user info'
        };
      }

      this.loggingService.debug('[AUTH_SERVICE] User info from Google:', userInfo);

      // Use the actual Google user ID
      const googleId = userInfo.id;

      // Create or update user record
      this.loggingService.debug('[AUTH_SERVICE] Creating/updating user record for Google ID:', userInfo.id);
      const { isNewUser, user } = await this.userDataAccess.createOrUpdateUser(
        userInfo.id,
        userInfo.email,
        userInfo.name
      );

      this.loggingService.debug('[AUTH_SERVICE] User record created/updated, isNewUser:', isNewUser, 'user:', user);

      // Create session data with database ID
      const userSessionData = {
        userId: user.id.toString(), // Use numeric database ID
        googleId: googleId,
        email: userInfo.email,
        name: userInfo.name,
        provider: 'google',
        providerId: userInfo.id,
      };

      // User is authenticated - let them log in regardless of compliance
      return {
        success: true,
        redirectUrl: '/api-key',
        sessionData: userSessionData
      };

    } catch (error) {
      this.loggingService.error('[AUTH_SERVICE] Error processing Google callback:', error);
      return {
        success: false,
        redirectUrl: '/?error=callback_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a response with session cookie and redirect
   */
  async createAuthenticatedResponse(
    sessionData: SessionData, 
    redirectUrl: string, 
    request: NextRequest
  ): Promise<NextResponse> {
    try {
      this.loggingService.debug('[AUTH_SERVICE] Creating authenticated response with session data:', sessionData);
      
      const token = await SessionManager.createSession(sessionData);
      this.loggingService.debug('[AUTH_SERVICE] JWT token created successfully');
      
      const response = NextResponse.redirect(new URL(redirectUrl, request.url));
      
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
      
      response.cookies.set('edgar_session', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });

      this.loggingService.debug(`[AUTH_SERVICE] Cookie set successfully, redirecting to: ${redirectUrl}`);
      return response;
    } catch (error) {
      this.loggingService.error('[AUTH_SERVICE] Error creating authenticated response:', error);
      throw error;
    }
  }

  /**
   * Exchange authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string, request: NextRequest): Promise<TokenResponse | null> {
    try {
      const redirectUri = this.getRedirectUri(request);
      this.loggingService.debug('[AUTH_SERVICE] Using redirect URI:', redirectUri);

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        this.loggingService.error('[AUTH_SERVICE] Token exchange failed:', errorText);
        return null;
      }

      return await tokenResponse.json();
    } catch (error) {
      this.loggingService.error('[AUTH_SERVICE] Error exchanging code for tokens:', error);
      return null;
    }
  }

  /**
   * Get user info from Google
   */
  private async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo | null> {
    try {
      const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        this.loggingService.error('[AUTH_SERVICE] Failed to get user info from Google');
        return null;
      }

      return await userResponse.json();
    } catch (error) {
      this.loggingService.error('[AUTH_SERVICE] Error getting Google user info:', error);
      return null;
    }
  }


  /**
   * Get the correct redirect URI for the current environment
   */
  private getRedirectUri(request: NextRequest): string {
    const isDevelopment = request.url.includes('localhost');
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    
    if (isDevelopment) {
      const url = new URL(request.url);
      return `http://localhost:${url.port}/api/auth/callback`;
    } else if (vercelUrl) {
      return `${vercelUrl}/api/auth/callback`;
    } else {
      return `${new URL(request.url).origin}/api/auth/callback`;
    }
  }
}
