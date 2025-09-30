import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { ApiKeyRouteService } from '@/services/routes/ApiKeyRouteService';
import { handleRouteError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const apiKeyRouteService = container.resolve(ApiKeyRouteService);
    const result = await apiKeyRouteService.getInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return handleRouteError(error, 'API_KEY_GET_ROUTE');
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKeyRouteService = container.resolve(ApiKeyRouteService);
    const result = await apiKeyRouteService.postInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    return handleRouteError(error, 'API_KEY_POST_ROUTE');
  }
}