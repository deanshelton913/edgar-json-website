import { NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { StripeService } from '@/services/StripeService';
import { LoggingService } from '@/services/LoggingService';

export async function POST() {
  const loggingService = container.resolve(LoggingService);
  
  try {
    // Authorize the request using cookie-based authentication
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      loggingService.warn('[BILLING_PORTAL] Unauthorized request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: authResult.message },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;
    loggingService.debug(`[BILLING_PORTAL] Creating portal session for user: ${userId}`);

    // Create billing portal session
    const stripeService = container.resolve(StripeService);
    const session = await stripeService.createPortalSession({
      userId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`,
    });

    loggingService.debug(`[BILLING_PORTAL] Portal session created: ${session.id} for user: ${userId}`);

    return NextResponse.json({
      success: true,
      url: session.url,
    });

  } catch (error) {
    loggingService.error(`[BILLING_PORTAL] Error creating portal session: ${error}`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
