import { NextRequest } from 'next/server';
import { container } from '@/lib/container-server';
import { UsageStatsRouteService } from '@/services/routes/UsageStatsRouteService';
import { handleRouteError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const usageStatsRouteService = container.resolve(UsageStatsRouteService);
    return await usageStatsRouteService.invokeV1(request);
  } catch (error) {
    return handleRouteError(error, 'USAGE_STATS_ROUTE');
  }
}
