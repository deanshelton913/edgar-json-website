import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { StripeService } from '@/services/StripeService';
import { StripeWebhookEvent, WebhookService } from '@/services/WebhookService';
import { LoggingService } from '@/services/LoggingService';

export async function POST(request: NextRequest) {
  const loggingService = container.resolve(LoggingService);
  let eventType = 'unknown';
  
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      loggingService.warn('[STRIPE_WEBHOOK] Missing stripe-signature header - ignoring request');
      return NextResponse.json({ received: true });
    }

    // Verify webhook signature
    const stripeService = container.resolve(StripeService);
    const event = await stripeService.constructWebhookEvent(body, signature);
    eventType = event.type;

    // Only process events we actually handle
    const handledEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ];

    if (handledEvents.includes(event.type)) {
      loggingService.debug(`[STRIPE_WEBHOOK] Processing event: ${event.type} (${event.id})`);
      
      // Process the webhook event using the service
      const webhookService = container.resolve(WebhookService);
      await webhookService.processWebhookEvent(event as StripeWebhookEvent);
    } else {
      // Silently ignore unhandled events
      loggingService.debug(`[STRIPE_WEBHOOK] Ignoring unhandled event: ${event.type} (${event.id})`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    // Only log errors for events we actually handle
    const handledEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed'
    ];
    
    if (eventType !== 'unknown' && handledEvents.includes(eventType)) {
      loggingService.error(`[STRIPE_WEBHOOK] Error processing handled event (${eventType}): ${error}`);
    } else if (error instanceof Error && error.message.includes('signature verification failed')) {
      // This is likely a webhook from a different Stripe account or misconfigured endpoint
      loggingService.debug(`[STRIPE_WEBHOOK] Signature verification failed - likely wrong webhook endpoint or secret`);
    } else {
      // Log other errors at debug level to avoid noise
      loggingService.debug(`[STRIPE_WEBHOOK] Error processing webhook (${eventType}): ${error}`);
    }
    
    return NextResponse.json({ received: true });
  }
}

