import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { StripeService } from '@/services/StripeService';
import { SubscriptionDataAccess } from '@/data-access/SubscriptionDataAccess';
import { UserDataAccess } from '@/data-access/UserDataAccess';
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

    // Get user's current subscription using database ID
    const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
    const subscription = await subscriptionDataAccess.getSubscriptionByUserId(userDbId);
    
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    // Prevent cancellation of free subscriptions
    if (subscription.planId === 'free') {
      return NextResponse.json(
        { success: false, error: 'Free subscriptions cannot be canceled' },
        { status: 400 }
      );
    }

    // Cancel subscription in Stripe (skip if it's a test subscription)
    if (subscription.stripeSubscriptionId.startsWith('test_')) {
      loggingService.debug(`[CANCEL_SUBSCRIPTION] Skipping Stripe cancellation for test subscription: ${subscription.stripeSubscriptionId}`);
    } else {
      const stripeService = container.resolve(StripeService);
      await stripeService.cancelSubscription(subscription.stripeSubscriptionId);
    }

    // Update subscription status in database
    await subscriptionDataAccess.updateSubscriptionStatus(
      subscription.stripeSubscriptionId,
      'active', // Still active until period end
      subscription.currentPeriodStart,
      subscription.currentPeriodEnd,
      true, // cancelAtPeriodEnd = true
      undefined // canceledAt stays undefined until period actually ends
    );

        loggingService.debug(`[CANCEL_SUBSCRIPTION] Subscription canceled for user: ${userDbId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period'
    });

  } catch (error) {
    loggingService.error(`[CANCEL_SUBSCRIPTION] Error canceling subscription: ${error}`);
    
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
