import { injectable, inject } from "tsyringe";
import { NextRequest } from "next/server";
import { CookieAuthorizerService } from "../authorizers/CookieAuthorizerService";
import { StripeService } from "../stripe/StripeService";
import { LoggingService } from "../LoggingService";

export interface CreatePortalSessionResult {
  success: boolean;
  url?: string;
  error?: string;
  message?: string;
}

@injectable()
export class CreatePortalSessionRouteService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("CookieAuthorizerService") private cookieAuthorizer: CookieAuthorizerService,
    @inject("StripeService") private stripeService: StripeService,
  ) {}

  /**
   * Main entry point for create portal session route - creates Stripe billing portal session
   */
  async postInvokeV1(request: NextRequest): Promise<CreatePortalSessionResult> {
    try {
      this.loggingService.debug('[CREATE_PORTAL_ROUTE] Starting create portal session request');

      // Log request details for debugging
      const userAgent = request.headers.get('user-agent') || 'unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      
      this.loggingService.debug(`[CREATE_PORTAL_ROUTE] Request from IP: ${ipAddress}, User-Agent: ${userAgent}`);

      // Authorize the request using cookie-based authentication
      const authResult = await this.cookieAuthorizer.authorizeRequest(request);

      if (!authResult.success) {
        this.loggingService.warn('[CREATE_PORTAL_ROUTE] Unauthorized request');
        return {
          success: false,
          error: 'Unauthorized',
          message: authResult.message
        };
      }

      const userId = authResult.userId!;
      this.loggingService.debug(`[CREATE_PORTAL_ROUTE] Creating portal session for user: ${userId}`);

      // Create billing portal session
      const session = await this.stripeService.createPortalSession({
        userId,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/billing`,
      });

      this.loggingService.debug(`[CREATE_PORTAL_ROUTE] Portal session created: ${session.id} for user: ${userId}`);

      return {
        success: true,
        url: session.url,
      };

    } catch (error) {
      this.loggingService.error(`[CREATE_PORTAL_ROUTE] Error creating portal session: ${error}`);
      throw error;
    }
  }
}
