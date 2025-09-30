import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { WebhookRouteService } from '@/services/routes/WebhookRouteService';
import { handleRouteError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const webhookRouteService = container.resolve(WebhookRouteService);
    const result = await webhookRouteService.postInvokeV1(request);
    
    return NextResponse.json({
      success: result.success,
      received: result.received,
      ...(result.error && { error: result.error }),
      ...(result.message && { message: result.message }),
    });
  } catch (error) {
    return handleRouteError(error, 'WEBHOOK_ROUTE');
  }
}

