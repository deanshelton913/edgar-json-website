import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Upstash rate limiting service that works in Edge Runtime (middleware)
 * Uses HTTP instead of TCP, so it's webpack-safe
 */
export class UpstashRateLimitService {
  private ratelimit: Ratelimit;

  constructor() {
    // Initialize Upstash Redis with environment variables
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Initialize rate limiter with sliding window
    this.ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
      analytics: true,
    });
  }

  async checkLimit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    try {
      const result = await this.ratelimit.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      console.error('[UPSTASH_RATE_LIMIT] Check limit error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      };
    }
  }

  async checkApiKeyLimit(apiKey: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    // Use API key as identifier for rate limiting
    return this.checkLimit(`api_key:${apiKey}`);
  }

  async checkUserLimit(userId: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    // Use user ID as identifier for rate limiting
    return this.checkLimit(`user:${userId}`);
  }
}
