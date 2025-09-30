import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { StripeService } from "../stripe/StripeService";
import { LoggingService } from "../LoggingService";

export interface CreateCheckoutSessionResult {
  success: boolean;
  url?: string;
  error?: string;
  message?: string;
}

@injectable()
export class CreateCheckoutSessionRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("StripeService") private stripeService: StripeService,
  ) {}

  /**
   * Main entry point for create checkout session route - creates Stripe checkout session
   */
  async postInvokeV1(request: NextRequest): Promise<CreateCheckoutSessionResult> {
    try {
      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] Starting create checkout session request');

      // Get user ID from middleware headers
      const userId = request.headers.get('x-user-id');
      const userEmail = request.headers.get('x-user-email');

      if (!userId || !userEmail) {
        this.loggingService.warn('[CREATE_CHECKOUT_ROUTE] Unauthorized request');
        return {
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        };
      }

      const { planId } = await request.json();
      
      if (!planId) {
        return {
          success: false,
          error: 'Missing planId'
        };
      }

      // Validate plan ID
      const validPlans = ['pro', 'enterprise'];
      if (!validPlans.includes(planId)) {
        return {
          success: false,
          error: 'Invalid plan ID'
        };
      }

      this.loggingService.debug(`[CREATE_CHECKOUT_ROUTE] Creating checkout session for user: ${userId}, plan: ${planId}`);

      // Determine the correct base URL using environment variables
      const isVercel = process.env.VERCEL === '1';
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = (isVercel || isProduction) 
        ? 'https://www.edgar-json.com' 
        : 'http://localhost:3000';

      const successUrl = `${baseUrl}/billing?success=true`;
      const cancelUrl = `${baseUrl}/billing?canceled=true`;

      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] VERCEL:', process.env.VERCEL);
      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] NODE_ENV:', process.env.NODE_ENV);
      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] Is Vercel:', isVercel);
      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] Is production:', isProduction);
      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] Base URL:', baseUrl);
      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] Success URL:', successUrl);
      this.loggingService.debug('[CREATE_CHECKOUT_ROUTE] Cancel URL:', cancelUrl);

      // Create checkout session
      const session = await this.stripeService.createCheckoutSession({
        planId,
        userId,
        email: userEmail,
        successUrl,
        cancelUrl,
      });

      this.loggingService.debug(`[CREATE_CHECKOUT_ROUTE] Checkout session created: ${session.id} for user: ${userId}`);

      return {
        success: true,
        url: session.url || undefined,
      };

    } catch (error) {
      this.loggingService.error(`[CREATE_CHECKOUT_ROUTE] Error creating checkout session: ${error}`);
      throw error;
    }
  }
}
