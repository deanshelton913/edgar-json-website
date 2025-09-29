import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { AuthUserRouteService } from '@/services/routes/AuthUserRouteService';
import { handleRouteError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const authUserRouteService = container.resolve(AuthUserRouteService);
    const result = await authUserRouteService.getInvokeV1(request);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error, 'AUTH_USER_ROUTE');
  }
}
