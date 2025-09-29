import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { AuthenticationService } from '@/services/AuthenticationService';

export async function GET(request: NextRequest) {
  try {
    const authService = container.resolve(AuthenticationService);
    const result = await authService.processGoogleCallback(request);

    if (!result.success) {
      return NextResponse.redirect(new URL(result.redirectUrl!, request.url));
    }

    // Create authenticated response with session cookie
    return await authService.createAuthenticatedResponse(
      result.sessionData!,
      result.redirectUrl!,
      request
    );

  } catch (error) {
    console.error('Callback error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.redirect(
      new URL('/?error=callback_error', request.url)
    );
  }
}