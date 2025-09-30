import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { BillingSubscriptionRouteService } from '@/services/routes/BillingSubscriptionRouteService';
import { handleRouteError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const billingSubscriptionRouteService = container.resolve(BillingSubscriptionRouteService);
    const result = await billingSubscriptionRouteService.getInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      planId: result.planId,
      status: result.status,
      currentPeriodEnd: result.currentPeriodEnd,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    });
  } catch (error) {
    return handleRouteError(error, 'BILLING_SUBSCRIPTION_ROUTE');
  }
}
