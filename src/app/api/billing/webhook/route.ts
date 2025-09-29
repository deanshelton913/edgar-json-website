import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { StripeService } from '@/services/StripeService';
import { SubscriptionDataAccess } from '@/data-access/SubscriptionDataAccess';
import { UserDataAccess } from '@/data-access/UserDataAccess';
import { LoggingService } from '@/services/LoggingService';

interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: any; // Stripe webhook objects have complex, dynamic structures
  };
}

export async function POST(request: NextRequest) {
  console.log('[STRIPE_WEBHOOK] Webhook endpoint called');
  const loggingService = container.resolve(LoggingService);
  
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      loggingService.warn('[STRIPE_WEBHOOK] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    console.log('[STRIPE_WEBHOOK] About to verify signature');
    const stripeService = container.resolve(StripeService);
    const event = await stripeService.constructWebhookEvent(body, signature);
    console.log('[STRIPE_WEBHOOK] Signature verified successfully');

    loggingService.debug(`[STRIPE_WEBHOOK] Received event: ${event.type}`);
    console.log(`[STRIPE_WEBHOOK] Received event: ${event.type}`, event.id);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`[STRIPE_WEBHOOK] Processing checkout.session.completed`);
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        loggingService.debug(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type} - ignoring`);
        console.log(`[STRIPE_WEBHOOK] Ignoring unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    loggingService.error(`[STRIPE_WEBHOOK] Error processing webhook: ${error}`);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: StripeWebhookEvent['data']['object']) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    loggingService.debug(`[STRIPE_WEBHOOK] Checkout session completed: ${session.id}`);
    console.log(`[STRIPE_WEBHOOK] Checkout session completed: ${session.id}`);
    loggingService.debug(`[STRIPE_WEBHOOK] Session metadata:`, JSON.stringify(session.metadata, null, 2));
    console.log(`[STRIPE_WEBHOOK] Session metadata:`, JSON.stringify(session.metadata, null, 2));
    loggingService.debug(`[STRIPE_WEBHOOK] Session subscription: ${session.subscription}`);
    console.log(`[STRIPE_WEBHOOK] Session subscription: ${session.subscription}`);
    
    // Get user ID from metadata (now numeric database ID)
    const userId = session.metadata?.userId;
    if (!userId) {
      loggingService.error(`[STRIPE_WEBHOOK] No userId in session metadata`);
      return;
    }

    // Convert string ID to number for database operations
    const userDbId = parseInt(userId, 10);
    if (isNaN(userDbId)) {
      loggingService.error(`[STRIPE_WEBHOOK] Invalid userId in metadata: ${userId}`);
      return;
    }

    // Get user from database using numeric ID
    const userDataAccess = container.resolve(UserDataAccess);
    const user = await userDataAccess.getUserById(userDbId);
    
    if (!user) {
      loggingService.error(`[STRIPE_WEBHOOK] User not found: ${userDbId}`);
      return;
    }

    // For subscription checkouts, the subscription might not be created yet
    // We'll handle it when customer.subscription.created fires
    if (session.subscription) {
      // Get subscription from Stripe
      const stripeService = container.resolve(StripeService);
      const subscription = await stripeService.getSubscription(session.subscription);
      
      if (!subscription) {
        loggingService.error(`[STRIPE_WEBHOOK] Subscription not found: ${session.subscription}`);
        return;
      }

      // Create subscription record
      const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
      await subscriptionDataAccess.createSubscription({
        userId: user.id,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        planId: session.metadata?.planId || 'pro',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      // API key tier is now managed by subscription - no direct update needed

      loggingService.debug(`[STRIPE_WEBHOOK] Subscription created for user: ${user.id}`);
    } else {
      loggingService.debug(`[STRIPE_WEBHOOK] No subscription in session, waiting for customer.subscription.created`);
    }

  } catch (error) {
    loggingService.error(`[STRIPE_WEBHOOK] Error handling checkout session completed: ${error}`);
  }
}

async function handleSubscriptionUpdated(subscription: StripeWebhookEvent['data']['object']) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    loggingService.debug(`[STRIPE_WEBHOOK] Subscription updated: ${subscription.id}`);
    loggingService.debug(`[STRIPE_WEBHOOK] Subscription metadata:`, JSON.stringify(subscription.metadata, null, 2));
    
    const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
    
    // Check if subscription already exists
    const existingSubscription = await subscriptionDataAccess.getSubscriptionByStripeId(subscription.id);
    
    if (!existingSubscription) {
      // This is a new subscription, we need to create it
      const userId = subscription.metadata?.userId;
      if (!userId) {
        loggingService.error(`[STRIPE_WEBHOOK] No userId in subscription metadata`);
        return;
      }

      // Convert string ID to number for database operations
      const userDbId = parseInt(userId, 10);
      if (isNaN(userDbId)) {
        loggingService.error(`[STRIPE_WEBHOOK] Invalid userId in subscription metadata: ${userId}`);
        return;
      }

      // Get user from database using numeric ID
      const userDataAccess = container.resolve(UserDataAccess);
      const user = await userDataAccess.getUserById(userDbId);
      
      if (!user) {
        loggingService.error(`[STRIPE_WEBHOOK] User not found: ${userDbId}`);
        return;
      }

      // Create subscription record
      await subscriptionDataAccess.createSubscription({
        userId: user.id,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        planId: subscription.metadata?.planId || 'pro',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: subscription.status as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      // API key tier is now managed by subscription - no direct update needed

      loggingService.debug(`[STRIPE_WEBHOOK] New subscription created for user: ${user.id}`);
    } else {
      // Update existing subscription
      await subscriptionDataAccess.updateSubscriptionStatus(
        subscription.id,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end,
        subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined
      );

      loggingService.debug(`[STRIPE_WEBHOOK] Subscription updated: ${subscription.id}`);
    }

  } catch (error) {
    loggingService.error(`[STRIPE_WEBHOOK] Error handling subscription updated: ${error}`);
  }
}

async function handleSubscriptionDeleted(subscription: StripeWebhookEvent['data']['object']) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    loggingService.debug(`[STRIPE_WEBHOOK] Subscription deleted: ${subscription.id}`);
    
    const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
    await subscriptionDataAccess.updateSubscriptionStatus(
      subscription.id,
      'canceled',
      undefined,
      undefined,
      true,
      new Date()
    );

    // Downgrade to free tier is now managed by subscription status

    loggingService.debug(`[STRIPE_WEBHOOK] Subscription canceled: ${subscription.id}`);

  } catch (error) {
    loggingService.error(`[STRIPE_WEBHOOK] Error handling subscription deleted: ${error}`);
  }
}

async function handlePaymentSucceeded(invoice: StripeWebhookEvent['data']['object']) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    loggingService.debug(`[STRIPE_WEBHOOK] Payment succeeded for invoice: ${invoice.id}`);
    
    if (invoice.subscription) {
      const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
      await subscriptionDataAccess.updateSubscriptionStatus(
        invoice.subscription,
        'active'
      );
    }

  } catch (error) {
    loggingService.error(`[STRIPE_WEBHOOK] Error handling payment succeeded: ${error}`);
  }
}

async function handlePaymentFailed(invoice: StripeWebhookEvent['data']['object']) {
  const loggingService = container.resolve(LoggingService);
  
  try {
    loggingService.debug(`[STRIPE_WEBHOOK] Payment failed for invoice: ${invoice.id}`);
    
    if (invoice.subscription) {
      const subscriptionDataAccess = container.resolve(SubscriptionDataAccess);
      await subscriptionDataAccess.updateSubscriptionStatus(
        invoice.subscription,
        'past_due'
      );
    }

  } catch (error) {
    loggingService.error(`[STRIPE_WEBHOOK] Error handling payment failed: ${error}`);
  }
}

