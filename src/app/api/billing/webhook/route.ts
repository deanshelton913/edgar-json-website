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
      loggingService.warn('[STRIPE_WEBHOOK] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const stripeService = container.resolve(StripeService);
    const event = await stripeService.constructWebhookEvent(body, signature);
    eventType = event.type;

    // Only log events we actually handle
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
    }

    // Process the webhook event using the service
    const webhookService = container.resolve(WebhookService);
    await webhookService.processWebhookEvent(event as StripeWebhookEvent);

    return NextResponse.json({ received: true });

  } catch (error) {
    loggingService.error(`[STRIPE_WEBHOOK] Error processing webhook (${eventType}): ${error}`);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 200 }
    );
  }
}

