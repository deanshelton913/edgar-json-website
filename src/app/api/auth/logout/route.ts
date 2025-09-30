import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container-client';
import { LogoutRouteService } from '@/services/routes/LogoutRouteService';
import { handleRouteError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const logoutRouteService = container.resolve(LogoutRouteService);
    await logoutRouteService.postInvokeV1(request);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error, 'LOGOUT_ROUTE');
  }
}