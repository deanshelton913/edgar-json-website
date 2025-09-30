import { NextRequest } from 'next/server';
import { container } from '@/lib/container-server';
import { ParseRouteService } from '@/services/routes/ParseRouteService';
import { withRedisRouteHandlerResponse } from '@/lib/route-handler';

export async function GET(request: NextRequest) {
  return withRedisRouteHandlerResponse(
    request,
    'PARSE_GET_ROUTE',
    async (req) => {
      const parseRouteService = container.resolve(ParseRouteService);
      return await parseRouteService.getInvokeV1(req);
    }
  );
}

export async function POST(request: NextRequest) {
  return withRedisRouteHandlerResponse(
    request,
    'PARSE_POST_ROUTE',
    async (req) => {
      const parseRouteService = container.resolve(ParseRouteService);
      return await parseRouteService.postInvokeV1(req);
    }
  );
}