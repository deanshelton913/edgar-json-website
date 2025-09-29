import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';

export async function GET(request: NextRequest) {
  console.log('[AUTH_USER] Getting user info from session...');
  
  // Debug: Log all cookies
  const cookies = request.cookies.getAll();
  console.log('[AUTH_USER] All cookies:', cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));
  
  try {
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      console.log('[AUTH_USER] Authentication failed:', authResult.error);
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    console.log('[AUTH_USER] Session data found:', authResult);
    
    return NextResponse.json({
      authenticated: true,
      user: {
        userId: authResult.userId,
        email: authResult.email,
        name: authResult.name,
        provider: authResult.provider,
      },
    });

  } catch (error) {
    console.error('[AUTH_USER] Get user info error:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
