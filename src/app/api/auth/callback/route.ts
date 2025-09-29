import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { AuthCallbackRouteService } from '@/services/routes/AuthCallbackRouteService';

export async function GET(request: NextRequest) {
  try {
    const authCallbackRouteService = container.resolve(AuthCallbackRouteService);
    const result = await authCallbackRouteService.getInvokeV1(request);

    if (!result.success) {
      console.log('[CALLBACK] Auth failed, redirecting to:', result.redirectUrl);
      return NextResponse.redirect(new URL(result.redirectUrl!, request.url));
    }

    console.log('[CALLBACK] Auth successful, creating authenticated response');
    // Create authenticated response with session cookie
    return await authCallbackRouteService.createAuthenticatedResponse(
      result.sessionData!,
      result.redirectUrl!,
      request
    );

  } catch (error) {
    console.error('[CALLBACK] Callback error:', error);
    return NextResponse.redirect(
      new URL('/?error=callback_error', request.url)
    );
  }
}