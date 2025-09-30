import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { ReactivateSubscriptionRouteService } from '@/services/routes/ReactivateSubscriptionRouteService';
import { handleRouteError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const reactivateSubscriptionRouteService = container.resolve(ReactivateSubscriptionRouteService);
    const result = await reactivateSubscriptionRouteService.postInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    return handleRouteError(error, 'REACTIVATE_SUBSCRIPTION_ROUTE');
  }
}
