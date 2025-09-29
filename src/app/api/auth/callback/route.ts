import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { AuthenticationService } from '@/services/AuthenticationService';

export async function GET(request: NextRequest) {
  try {
    console.log('[CALLBACK] Starting callback processing');
    console.log('[CALLBACK] Request URL:', request.url);
    console.log('[CALLBACK] Search params:', new URL(request.url).searchParams.toString());
    
    const authService = container.resolve(AuthenticationService);
    const result = await authService.processGoogleCallback(request);

    console.log('[CALLBACK] Auth result:', result);

    if (!result.success) {
      console.log('[CALLBACK] Auth failed, redirecting to:', result.redirectUrl);
      return NextResponse.redirect(new URL(result.redirectUrl!, request.url));
    }

    console.log('[CALLBACK] Auth successful, creating authenticated response');
    // Create authenticated response with session cookie
    return await authService.createAuthenticatedResponse(
      result.sessionData!,
      result.redirectUrl!,
      request
    );

  } catch (error) {
    console.error('[CALLBACK] Callback error:', error);
    console.error('[CALLBACK] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.redirect(
      new URL('/?error=callback_error', request.url)
    );
  }
}