import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { DowngradeCanceledRouteService } from '@/services/routes/DowngradeCanceledRouteService';
import { handleRouteError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const downgradeCanceledRouteService = container.resolve(DowngradeCanceledRouteService);
    const result = await downgradeCanceledRouteService.postInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    return handleRouteError(error, 'DOWNGRADE_CANCELED_ROUTE');
  }
}