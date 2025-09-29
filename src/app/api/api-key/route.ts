import { NextRequest } from 'next/server';
import { container } from '@/lib/container';
import { ApiKeyRouteService } from '@/services/routes/ApiKeyRouteService';
import { withRedisRouteHandlerJson } from '@/lib/route-handler';

export async function GET(request: NextRequest) {
  return withRedisRouteHandlerJson(
    request,
    'API_KEY_GET_ROUTE',
    async (req) => {
      const apiKeyRouteService = container.resolve(ApiKeyRouteService);
      const result = await apiKeyRouteService.getInvokeV1(req);
      
      return {
        success: true,
        data: result.data
      };
    }
  );
}

export async function POST(request: NextRequest) {
  return withRedisRouteHandlerJson(
    request,
    'API_KEY_POST_ROUTE',
    async (req) => {
      const apiKeyRouteService = container.resolve(ApiKeyRouteService);
      const result = await apiKeyRouteService.postInvokeV1(req);
      
      return {
        success: true,
        data: result.data
      };
    }
  );
}