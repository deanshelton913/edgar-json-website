import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/lib/container';
import { RedisRateLimitService } from '@/services/RedisRateLimitService';
import { ApiKeyAuthorizerService } from '@/services/ApiKeyAuthorizerService';
import { LoggingService } from '@/services/LoggingService';

export async function GET(request: NextRequest) {
  const loggingService = container.resolve(LoggingService);
  try {
    const redisRateLimitService = container.resolve(RedisRateLimitService);
    const apiKeyAuthorizerService = container.resolve(ApiKeyAuthorizerService);

    // Simulate API key authorization
    const authResult = await apiKeyAuthorizerService.authorizeRequest(request);

    if (!authResult.success || !authResult.apiKey) {
      return NextResponse.json(
        { success: false, error: 'Authentication failed', message: authResult.message },
        { status: 401 }
      );
    }

    const apiKey = authResult.apiKey;

    // Check Redis health
    const isRedisHealthy = await redisRateLimitService.healthCheck();
    if (!isRedisHealthy) {
      loggingService.error('[TEST_REDIS_RATE_LIMIT] Redis health check failed');
      return NextResponse.json(
        { success: false, error: 'Redis connection failed', message: 'Unable to connect to Redis. Please check your REDIS_URL environment variable.' },
        { status: 500 }
      );
    }

    // Check rate limits using per-API-key configuration
    const rateLimitInfo = await redisRateLimitService.checkRateLimit(apiKey);

    if (rateLimitInfo.isLimited) {
      loggingService.warn(`[TEST_REDIS_RATE_LIMIT] Rate limit exceeded for API key: ${apiKey}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'You have exceeded your test rate limit. Please try again later.',
          rateLimitInfo: {
            requestsPerMinute: rateLimitInfo.requestsPerMinute,
            requestsPerDay: rateLimitInfo.requestsPerDay,
            currentMinuteCount: rateLimitInfo.currentMinuteCount,
            currentDayCount: rateLimitInfo.currentDayCount,
            resetTimeMinute: rateLimitInfo.resetTimeMinute,
            resetTimeDay: rateLimitInfo.resetTimeDay,
          },
        },
        { status: 429 }
      );
    }

    // Increment rate limit counters
    await redisRateLimitService.incrementRateLimit(apiKey);

    return NextResponse.json({
      success: true,
      message: `API call successful for API key: ${apiKey}. Request count: ${rateLimitInfo.currentMinuteCount + 1} (minute), ${rateLimitInfo.currentDayCount + 1} (day)`,
      rateLimitInfo: {
        requestsPerMinute: rateLimitInfo.requestsPerMinute,
        requestsPerDay: rateLimitInfo.requestsPerDay,
        currentMinuteCount: rateLimitInfo.currentMinuteCount + 1,
        currentDayCount: rateLimitInfo.currentDayCount + 1,
        resetTimeMinute: rateLimitInfo.resetTimeMinute,
        resetTimeDay: rateLimitInfo.resetTimeDay,
      },
    });

  } catch (error) {
    loggingService.error('[TEST_REDIS_RATE_LIMIT] Error in test rate limit API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
