import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { CreateCheckoutSessionRouteService } from '@/services/routes/CreateCheckoutSessionRouteService';
import { handleRouteError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const createCheckoutRouteService = container.resolve(CreateCheckoutSessionRouteService);
    const result = await createCheckoutRouteService.postInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    return handleRouteError(error, 'CREATE_CHECKOUT_SESSION_ROUTE');
  }
}