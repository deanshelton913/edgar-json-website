import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { StripeService } from "../stripe/StripeService";
import { WebhookService, StripeWebhookEvent } from "../stripe/WebhookService";
import { LoggingService } from "../LoggingService";

export interface WebhookRouteResult {
  success: boolean;
  received: boolean;
  error?: string;
  message?: string;
}

@injectable()
export class WebhookRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("StripeService") private stripeService: StripeService,
    @inject("WebhookService") private webhookService: WebhookService,
  ) {}

  /**
   * Main entry point for webhook route - processes Stripe webhook events
   */
  async postInvokeV1(request: NextRequest): Promise<WebhookRouteResult> {
    let eventType = 'unknown';
    
    try {
      this.loggingService.debug('[WEBHOOK_ROUTE] Starting webhook request processing');

      const body = await request.text();
      const signature = request.headers.get('stripe-signature');

      if (!signature) {
        this.loggingService.warn('[WEBHOOK_ROUTE] Missing stripe-signature header - ignoring request');
        return {
          success: false,
          received: true,
          error: 'Missing signature'
        };
      }

      // Construct webhook event using Stripe service (includes signature verification)
      const event = await this.stripeService.constructWebhookEvent(body, signature);
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
        this.loggingService.debug(`[WEBHOOK_ROUTE] Processing event: ${event.type} (${event.id})`);
        
        // Process the webhook event using the service
        await this.webhookService.processWebhookEvent(event as StripeWebhookEvent);
        
        this.loggingService.debug(`[WEBHOOK_ROUTE] Successfully processed event: ${event.type} (${event.id})`);
      } else {
        // Silently ignore unhandled events
        this.loggingService.debug(`[WEBHOOK_ROUTE] Ignoring unhandled event: ${event.type} (${event.id})`);
      }

      return {
        success: true,
        received: true
      };

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
        this.loggingService.error(`[WEBHOOK_ROUTE] Error processing handled event (${eventType}): ${error}`);
      } else if (error instanceof Error && error.message.includes('signature verification failed')) {
        // This is likely a webhook from a different Stripe account or misconfigured endpoint
        this.loggingService.debug(`[WEBHOOK_ROUTE] Signature verification failed - likely wrong webhook endpoint or secret`);
      } else {
        // Log other errors at debug level to avoid noise
        this.loggingService.debug(`[WEBHOOK_ROUTE] Error processing webhook (${eventType}): ${error}`);
      }
      
      // Always return received: true for Stripe webhooks to avoid retries
      return {
        success: false,
        received: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
