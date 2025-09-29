import { NextRequest } from "next/server";
import { container } from "@/lib/container";
import { UsageStatsRouteService } from "@/services/routes/UsageStatsRouteService";
import { withRedisRouteHandlerResponse } from "@/lib/route-handler";

export async function GET(request: NextRequest) {
  return withRedisRouteHandlerResponse(
    request,
    'USAGE_STATS_ROUTE',
    async (req) => {
      const usageStatsRouteService = container.resolve(UsageStatsRouteService);
      return await usageStatsRouteService.invokeV1(req);
    }
  );
}