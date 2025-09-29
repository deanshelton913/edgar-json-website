import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CancelSubscriptionRouteService } from '@/services/routes/CancelSubscriptionRouteService';
import { handleRouteError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const cancelSubscriptionRouteService = container.resolve(CancelSubscriptionRouteService);
    const result = await cancelSubscriptionRouteService.postInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    return handleRouteError(error, 'CANCEL_SUBSCRIPTION_ROUTE');
  }
}