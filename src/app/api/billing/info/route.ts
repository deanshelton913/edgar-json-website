import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CookieAuthorizerService } from '@/services/CookieAuthorizerService';
import { StripeService } from '@/services/StripeService';
import { SubscriptionDataAccess } from '@/data-access/SubscriptionDataAccess';
import { UserDataAccess } from '@/data-access/UserDataAccess';
import { LoggingService } from '@/services/LoggingService';

export async function GET(request: NextRequest) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    // Authorize the request using cookie-based authentication
    const cookieAuthorizer = container.resolve(CookieAuthorizerService);
    const authResult = await cookieAuthorizer.authorizeRequest();

    if (!authResult.success) {
      loggingService.warn('[BILLING_INFO] Unauthorized request');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: authResult.message },
        { status: 401 }
      );
    }

    const userId = authResult.userId!;
    loggingService.debug(`[BILLING_INFO] Getting billing info for user: ${userId}`);

    // Convert string ID to number for database operations
    const userDbId = parseInt(userId, 10);
    if (isNaN(userDbId)) {
      loggingService.warn(`[BILLING_INFO] Invalid user ID: ${userId}`);
      return NextResponse.json(
        { success: false, error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get subscription to find Stripe customer ID
    const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
    const subscription = await subscriptionDataAccess.getSubscriptionByUserId(userDbId);

    // Get user data for email and name
    const userDataAccess = container.resolve(UserDataAccess);
    const user = await userDataAccess.getUserById(userDbId);
    
    if (!user) {
      loggingService.warn(`[BILLING_INFO] User not found: ${userDbId}`);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!subscription) {
      // Return basic user info for free plan
      return NextResponse.json({
        success: true,
        email: user.email,
        name: user.name,
      });
    }

    // Get customer info from Stripe (skip for test customers)
    let customer = null;
    if (!subscription.stripeCustomerId.startsWith('test_')) {
      const stripeService = container.resolve(StripeService);
      try {
        customer = await stripeService.getCustomer(subscription.stripeCustomerId);
        loggingService.debug(`[BILLING_INFO] Found customer: ${customer?.id} for user: ${userDbId}`);
      } catch (error) {
        loggingService.warn(`[BILLING_INFO] Stripe customer not found: ${subscription.stripeCustomerId}`);
      }
    } else {
      loggingService.debug(`[BILLING_INFO] Skipping Stripe lookup for test customer: ${subscription.stripeCustomerId}`);
    }

    // Return billing info (use Stripe data if available, otherwise fall back to user data)
    return NextResponse.json({
      success: true,
      email: customer?.email || user.email,
      name: customer?.name || user.name,
      address: customer?.address ? {
        line1: customer.address.line1,
        line2: customer.address.line2,
        city: customer.address.city,
        state: customer.address.state,
        postalCode: customer.address.postal_code,
        country: customer.address.country,
      } : undefined,
      isTestCustomer: subscription.stripeCustomerId.startsWith('test_'),
    });

  } catch (error) {
    loggingService.error(`[BILLING_INFO] Error getting billing info: ${error}`);
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
