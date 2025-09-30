import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-server';
import { SubscriptionDataAccess } from '@/services/data-access/SubscriptionDataAccess';
import { StripeService } from '@/services/stripe/StripeService';
import { LoggingService } from '@/services/LoggingService';

export async function POST(request: NextRequest) {
  try {
    const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
    const stripeService = container.resolve(StripeService);
    const loggingService = container.resolve(LoggingService);

    // Get user ID from session (you'll need to implement this)
    const userId = 1; // Replace with actual user ID from session
    
    loggingService.debug(`[FIX_SUBSCRIPTION] Checking subscription status for user ${userId}`);

    // Get current subscription from database
    const dbSubscription = await subscriptionDataAccess.getSubscriptionByUserId(userId);
    
    if (!dbSubscription) {
      return NextResponse.json({
        success: true,
        message: 'No subscription found in database - user is on free tier',
        status: 'free'
      });
    }

    loggingService.debug(`[FIX_SUBSCRIPTION] Found subscription in DB: ${dbSubscription.stripeSubscriptionId}, status: ${dbSubscription.status}`);

    // Check subscription status in Stripe
    try {
      const stripeSubscription = await stripeService.getSubscription(dbSubscription.stripeSubscriptionId);
      
      if (!stripeSubscription) {
        // Subscription not found in Stripe, mark as canceled in DB
        await subscriptionDataAccess.updateSubscriptionStatus(
          dbSubscription.stripeSubscriptionId,
          'canceled',
          undefined,
          undefined,
          true,
          new Date()
        );

        loggingService.debug(`[FIX_SUBSCRIPTION] Subscription not found in Stripe, marked as canceled in DB`);

        return NextResponse.json({
          success: true,
          message: 'Subscription not found in Stripe, marked as canceled',
          status: 'canceled',
          stripeStatus: 'not_found',
          dbStatus: 'canceled'
        });
      }
      
      loggingService.debug(`[FIX_SUBSCRIPTION] Stripe subscription status: ${stripeSubscription.status}`);

      // If Stripe shows cancelled but DB doesn't, update DB
      if (stripeSubscription.status === 'canceled' && dbSubscription.status !== 'canceled') {
        await subscriptionDataAccess.updateSubscriptionStatus(
          dbSubscription.stripeSubscriptionId,
          'canceled',
          undefined,
          undefined,
          true,
          new Date()
        );

        loggingService.debug(`[FIX_SUBSCRIPTION] Updated DB subscription status to canceled`);

        return NextResponse.json({
          success: true,
          message: 'Subscription status updated to canceled',
          status: 'canceled',
          stripeStatus: stripeSubscription.status,
          dbStatus: 'canceled'
        });
      }

      // If Stripe shows active but DB shows canceled, update DB
      if (stripeSubscription.status === 'active' && dbSubscription.status === 'canceled') {
        await subscriptionDataAccess.updateSubscriptionStatus(
          dbSubscription.stripeSubscriptionId,
          'active',
          new Date(stripeSubscription.current_period_start * 1000),
          new Date(stripeSubscription.current_period_end * 1000),
          stripeSubscription.cancel_at_period_end,
          undefined
        );

        loggingService.debug(`[FIX_SUBSCRIPTION] Updated DB subscription status to active`);

        return NextResponse.json({
          success: true,
          message: 'Subscription status updated to active',
          status: 'active',
          stripeStatus: stripeSubscription.status,
          dbStatus: 'active'
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription status is already in sync',
        status: dbSubscription.status,
        stripeStatus: stripeSubscription.status,
        dbStatus: dbSubscription.status
      });

    } catch (stripeError) {
      loggingService.error(`[FIX_SUBSCRIPTION] Error checking Stripe subscription: ${stripeError}`);
      throw stripeError;
    }

  } catch (error) {
    console.error('Error fixing subscription status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
