import { NextRequest } from 'next/server';
import { container } from '@/lib/container';
import { AuthUserRouteService } from '@/services/routes/AuthUserRouteService';
import { withRedisRouteHandlerJson } from '@/lib/route-handler';

export async function GET(request: NextRequest) {
  return withRedisRouteHandlerJson(
    request,
    'AUTH_USER_ROUTE',
    async (req) => {
      const authUserRouteService = container.resolve(AuthUserRouteService);
      const result = await authUserRouteService.getInvokeV1(req);
      return result;
    }
  );
}