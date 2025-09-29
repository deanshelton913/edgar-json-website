import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { CreatePortalSessionRouteService } from '@/services/routes/CreatePortalSessionRouteService';
import { handleRouteError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const createPortalRouteService = container.resolve(CreatePortalSessionRouteService);
    const result = await createPortalRouteService.postInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      url: result.url,
    });
  } catch (error) {
    return handleRouteError(error, 'CREATE_PORTAL_SESSION_ROUTE');
  }
}