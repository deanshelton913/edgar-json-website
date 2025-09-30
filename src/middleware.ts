import { NextRequest, NextResponse } from 'next/server';

// Routes that require cookie authentication
const COOKIE_AUTH_ROUTES = [
  '/api/api-key',
  '/api/billing',
  '/api/compliance',
  '/api/tos',
  '/api/usage-stats',
];

// API key routes are now handled by individual route services

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth',
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

  // API key authentication is now handled by individual route services

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
      const sessionData = payload as { userId?: string; email?: string };
      
      const response = NextResponse.next();
      response.headers.set('x-user-id', sessionData.userId || '');
      response.headers.set('x-user-email', sessionData.email || '');
      return response;
    } catch {
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



export const config = {
  matcher: [
    '/api/((?!auth/callback|auth/logout).*)',
  ],
};
