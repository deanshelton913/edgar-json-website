import { NextRequest } from "next/server";
import { container } from "@/lib/container";
import { FilingsRouteService } from "@/services/routes/FilingsRouteService";
import { withRedisRouteHandlerResponse } from "@/lib/route-handler";

export async function GET(request: NextRequest) {
  return withRedisRouteHandlerResponse(
    request,
    'FILINGS_GET_ROUTE',
    async (req) => {
      const filingsRouteService = container.resolve(FilingsRouteService);
      return await filingsRouteService.getInvokeV1(req);
    }
  );
}

export async function POST(request: NextRequest) {
  return withRedisRouteHandlerResponse(
    request,
    'FILINGS_POST_ROUTE',
    async (req) => {
      const filingsRouteService = container.resolve(FilingsRouteService);
      return await filingsRouteService.postInvokeV1(req);
    }
  );
}