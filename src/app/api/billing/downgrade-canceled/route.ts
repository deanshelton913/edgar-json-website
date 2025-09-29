import { NextRequest } from 'next/server';
import { container } from '@/lib/container';
import { DowngradeCanceledRouteService } from '@/services/routes/DowngradeCanceledRouteService';
import { withRedisRouteHandlerJson } from '@/lib/route-handler';

export async function POST(request: NextRequest) {
  return withRedisRouteHandlerJson(
    request,
    'DOWNGRADE_CANCELED_ROUTE',
    async (req) => {
      const downgradeCanceledRouteService = container.resolve(DowngradeCanceledRouteService);
      const result = await downgradeCanceledRouteService.postInvokeV1(req);
      
      return {
        success: true,
        message: result.message
      };
    }
  );
}