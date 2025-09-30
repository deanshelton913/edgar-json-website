import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { ApiKeyDeleteRouteService } from '@/services/routes/ApiKeyDeleteRouteService';
import { handleRouteError } from '@/lib/errors';

export async function DELETE(request: NextRequest) {
  try {
    const apiKeyDeleteRouteService = container.resolve(ApiKeyDeleteRouteService);
    const result = await apiKeyDeleteRouteService.deleteInvokeV1(request);
    
    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    return handleRouteError(error, 'API_KEY_DELETE_ROUTE');
  }
}