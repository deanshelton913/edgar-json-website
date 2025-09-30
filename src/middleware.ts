import { NextRequest, NextResponse } from 'next/server';
import { UpstashApiKeyAuthorizerService } from '@/services/authorizers/UpstashApiKeyAuthorizerService';

// Routes that require cookie authentication
const COOKIE_AUTH_ROUTES = [
  '/api/api-key',
  '/api/billing',
  '/api/compliance',
  '/api/tos',
  '/api/usage-stats',
];

// Routes that require API key authentication
const API_KEY_AUTH_ROUTES = [
  '/api/v1/filings',
  '/api/v1/usage',
  '/api/parse',
];

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/config-check',
  '/api/tos/content',
  '/api/billing/webhook',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Handle cookie authentication
  if (COOKIE_AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return handleCookieAuth(request);
  }

  // Handle API key authentication
  if (API_KEY_AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return handleApiKeyAuth(request);
  }

  return NextResponse.next();
}

async function handleCookieAuth(request: NextRequest): Promise<NextResponse> {
  try {
    const sessionCookie = request.cookies.get('edgar_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { success: false, error: 'No session cookie found' },
        { status: 401 }
      );
    }

    // Validate JWT token
    const { jwtVerify } = await import('jose');
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
    
    try {
      const { payload } = await jwtVerify(sessionCookie.value, secret);
      const sessionData = payload as any;
      
      const response = NextResponse.next();
      response.headers.set('x-user-id', sessionData.userId || '');
      response.headers.set('x-user-email', sessionData.email || '');
      return response;
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: 'Invalid session token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Cookie auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

async function handleApiKeyAuth(request: NextRequest): Promise<NextResponse> {
  try {
    // Use Upstash services that work in Edge Runtime
    const apiKeyAuthorizer = new UpstashApiKeyAuthorizerService();
    const authResult = await apiKeyAuthorizer.authorizeRequest(request);

    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error, message: authResult.message },
        { status: 401 }
      );
    }

    // Add user info to headers for downstream routes
    const response = NextResponse.next();
    response.headers.set('x-user-id', authResult.userId || '');
    response.headers.set('x-user-email', authResult.email || '');
    response.headers.set('x-api-key', authResult.apiKey || '');
    return response;
  } catch (error) {
    console.error('[MIDDLEWARE] API key auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    '/api/((?!auth/callback|auth/logout).*)',
  ],
};
