import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { StripeService } from '@/services/StripeService';
import { LoggingService } from '@/services/LoggingService';

export async function POST(request: NextRequest) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    // Authorize the request using cookie-based authentication
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      loggingService.warn('[BILLING_CHECKOUT] Unauthorized request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: authResult.message },
        { status: 401 }
      );
    }

    const { planId } = await request.json();
    
    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'Missing planId' },
        { status: 400 }
      );
    }

    // Validate plan ID
    const validPlans = ['pro', 'enterprise'];
    if (!validPlans.includes(planId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const userId = authResult.userId!;
    loggingService.debug(`[BILLING_CHECKOUT] Creating checkout session for user: ${userId}, plan: ${planId}`);

    // Get user email from the auth result
    const userEmail = authResult.email;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'User email not found' },
        { status: 400 }
      );
    }

    // Create checkout session
    const stripeService = container.resolve(StripeService);
    const session = await stripeService.createCheckoutSession({
      planId,
      userId,
      email: userEmail,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing?canceled=true`,
    });

    loggingService.debug(`[BILLING_CHECKOUT] Checkout session created: ${session.id} for user: ${userId}`);

    return NextResponse.json({
      success: true,
      url: session.url,
    });

  } catch (error) {
    loggingService.error(`[BILLING_CHECKOUT] Error creating checkout session: ${error}`);
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
