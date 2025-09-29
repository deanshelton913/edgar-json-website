import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { StripeService } from '@/services/StripeService';
import { SubscriptionDataAccess } from '@/data-access/SubscriptionDataAccess';
import { UserDataAccess } from '@/data-access/UserDataAccess';
import { ApiKeyDataAccess } from '@/data-access/ApiKeyDataAccess';
import { ApiKeyCacheService } from '@/services/ApiKeyCacheService';
import { LoggingService } from '@/services/LoggingService';

export async function POST(request: NextRequest) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    // Authenticate user
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID not found' },
        { status: 400 }
      );
    }

    // Convert string ID to number for database operations
    const userDbId = parseInt(userId, 10);
    if (isNaN(userDbId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get user data using database ID
    const userDataAccess = container.resolve(UserDataAccess);
    const user = await userDataAccess.getUserById(userDbId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the latest checkout session ID from the request
    const { checkoutSessionId } = await request.json();
    
    if (!checkoutSessionId) {
      return NextResponse.json(
        { success: false, error: 'Checkout session ID required' },
        { status: 400 }
      );
    }

    // Get the checkout session from Stripe
    const stripeService = container.resolve(StripeService);
    const session = await stripeService.getCheckoutSession(checkoutSessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Checkout session not found' },
        { status: 404 }
      );
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get or create customer
    const customer = await stripeService.getOrCreateCustomer(userId);
    
    // Get subscription from Stripe
    const subscription = await stripeService.getSubscription(session.subscription as string);
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Create subscription record
    const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
    await subscriptionDataAccess.createSubscription({
      userId: user.id,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      planId: 'pro',
      status: subscription.status as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    // Update API key tier
    const apiKeyDataAccess = container.resolve(ApiKeyDataAccess);
    const apiKeyCacheService = container.resolve(ApiKeyCacheService);
    
    // Get user's current API key info
    const currentApiKey = await apiKeyDataAccess.getApiKeyByUserId(user.id);
    if (currentApiKey) {
      // Clear the cache so new limits take effect immediately
      await apiKeyCacheService.invalidateApiKey(currentApiKey.apiKey);
    }

    loggingService.debug(`[MANUAL_WEBHOOK] Successfully processed checkout session: ${checkoutSessionId} for user: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription created successfully',
      subscriptionId: subscription.id,
      customerId: customer.id
    });

  } catch (error) {
    loggingService.error(`[MANUAL_WEBHOOK] Error processing checkout session: ${error}`);
    
    return NextResponse.json(
      { success: false, error: 'Failed to process checkout session' },
      { status: 500 }
    );
  }
}
