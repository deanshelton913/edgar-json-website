import { injectable, inject } from "tsyringe";
import { createClient, RedisClientType } from 'redis';
import type { LoggingService } from "./LoggingService";
import { ApiKeyCacheService } from "./ApiKeyCacheService";

export interface RateLimitInfo {
  requestsPerMinute: number;
  requestsPerDay: number;
  currentMinuteCount: number;
  currentDayCount: number;
  resetTimeMinute: string;
  resetTimeDay: string;
  isLimited: boolean;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerDay: number;
  windowSizeMinutes?: number;
  windowSizeDays?: number;
}

@injectable()
export class RedisRateLimitService {
  private redis: RedisClientType | null = null;
  private isConnected = false;

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("ApiKeyCacheService") private apiKeyCacheService: ApiKeyCacheService,
  ) {}

  /**
   * Initialize Redis connection
   */
  private async ensureConnection(): Promise<void> {
    if (this.isConnected && this.redis) {
      return;
    }

    try {
      const redisUrl = process.env.REDIS_URL;
      this.loggingService.debug(`[REDIS_RATE_LIMIT] Redis URL: ${redisUrl}`);
      
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      this.loggingService.debug(`[REDIS_RATE_LIMIT] Connecting to Redis with URL: ${redisUrl}`);
      
      this.redis = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.loggingService.error('[REDIS_RATE_LIMIT] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.redis.on('error', (err) => {
        this.loggingService.error('[REDIS_RATE_LIMIT] Redis error:', err);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        this.loggingService.debug('[REDIS_RATE_LIMIT] Connected to Redis');
        this.isConnected = true;
      });

      this.redis.on('disconnect', () => {
        this.loggingService.warn('[REDIS_RATE_LIMIT] Disconnected from Redis');
        this.isConnected = false;
      });

      await this.redis.connect();
      
    } catch (error) {
      this.loggingService.error('[REDIS_RATE_LIMIT] Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Check if an API key has exceeded rate limits using per-API-key configuration
   */
  async checkRateLimit(apiKey: string): Promise<RateLimitInfo> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      // Get API key configuration from cache
      const rateLimitConfig = await this.apiKeyCacheService.getRateLimitConfig(apiKey);
      if (!rateLimitConfig) {
        this.loggingService.warn(`[REDIS_RATE_LIMIT] No rate limit config found for API key: ${apiKey}`);
        // Return unlimited access if API key not found
        return {
          requestsPerMinute: 0,
          requestsPerDay: 0,
          currentMinuteCount: 0,
          currentDayCount: 0,
          resetTimeMinute: new Date(Date.now() + 60000).toISOString(),
          resetTimeDay: new Date(Date.now() + 86400000).toISOString(),
          isLimited: false,
        };
      }

      const now = new Date();
      const minuteKey = this.getMinuteKey(apiKey, now);
      const dayKey = this.getDayKey(apiKey, now);

      // Get current counts using pipeline for efficiency
      const pipeline = this.redis.multi();
      pipeline.get(minuteKey);
      pipeline.get(dayKey);
      pipeline.expire(minuteKey, 60); // Set TTL for minute key
      pipeline.expire(dayKey, 86400); // Set TTL for day key (24 hours)
      
      const results = await pipeline.exec();
      
      const minuteCount = results?.[0] ? parseInt(results[0] as string) || 0 : 0;
      const dayCount = results?.[1] ? parseInt(results[1] as string) || 0 : 0;

      const isLimited = minuteCount >= rateLimitConfig.requestsPerMinute || dayCount >= rateLimitConfig.requestsPerDay;

      // Calculate reset times
      const nextMinute = new Date(now);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1, 0, 0);
      
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      this.loggingService.debug(`[REDIS_RATE_LIMIT] Rate limit check for ${apiKey}: minute=${minuteCount}/${rateLimitConfig.requestsPerMinute}, day=${dayCount}/${rateLimitConfig.requestsPerDay}, limited=${isLimited}`);

      return {
        requestsPerMinute: rateLimitConfig.requestsPerMinute,
        requestsPerDay: rateLimitConfig.requestsPerDay,
        currentMinuteCount: minuteCount,
        currentDayCount: dayCount,
        resetTimeMinute: nextMinute.toISOString(),
        resetTimeDay: nextDay.toISOString(),
        isLimited,
      };

    } catch (error) {
      this.loggingService.error('[REDIS_RATE_LIMIT] Error checking rate limit:', error);
      
      // Fallback to allowing the request if Redis is down
      return {
        requestsPerMinute: 0,
        requestsPerDay: 0,
        currentMinuteCount: 0,
        currentDayCount: 0,
        resetTimeMinute: new Date(Date.now() + 60000).toISOString(),
        resetTimeDay: new Date(Date.now() + 86400000).toISOString(),
        isLimited: false, // Fail open - allow requests if Redis is down
      };
    }
  }

  /**
   * Increment rate limit counters for an API key
   */
  async incrementRateLimit(apiKey: string): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const now = new Date();
      const minuteKey = this.getMinuteKey(apiKey, now);
      const dayKey = this.getDayKey(apiKey, now);

      // Use pipeline for atomic operations
      const pipeline = this.redis.multi();
      pipeline.incr(minuteKey);
      pipeline.expire(minuteKey, 60); // Set TTL for minute key
      pipeline.incr(dayKey);
      pipeline.expire(dayKey, 86400); // Set TTL for day key (24 hours)
      
      await pipeline.exec();

      this.loggingService.debug(`[REDIS_RATE_LIMIT] Incremented rate limit counters for ${apiKey}`);

    } catch (error) {
      this.loggingService.error('[REDIS_RATE_LIMIT] Error incrementing rate limit:', error);
      // Don't throw - we don't want to break the request if rate limiting fails
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(apiKey: string): Promise<RateLimitInfo> {
    return this.checkRateLimit(apiKey);
  }

  /**
   * Reset rate limit counters for an API key (admin function)
   */
  async resetRateLimit(apiKey: string): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const now = new Date();
      const minuteKey = this.getMinuteKey(apiKey, now);
      const dayKey = this.getDayKey(apiKey, now);

      await this.redis.del(minuteKey, dayKey);
      
      this.loggingService.debug(`[REDIS_RATE_LIMIT] Reset rate limit counters for ${apiKey}`);

    } catch (error) {
      this.loggingService.error('[REDIS_RATE_LIMIT] Error resetting rate limit:', error);
      throw error;
    }
  }

  /**
   * Generate minute-based key for Redis
   */
  private getMinuteKey(apiKey: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `rate_limit:${apiKey}:minute:${year}-${month}-${day}:${hour}:${minute}`;
  }

  /**
   * Generate day-based key for Redis
   */
  private getDayKey(apiKey: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `rate_limit:${apiKey}:day:${year}-${month}-${day}`;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
        this.isConnected = false;
        this.loggingService.debug('[REDIS_RATE_LIMIT] Redis connection closed');
      } catch (error) {
        this.loggingService.error('[REDIS_RATE_LIMIT] Error closing Redis connection:', error);
      }
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        return false;
      }

      await this.redis.ping();
      return true;
    } catch (error) {
      this.loggingService.error('[REDIS_RATE_LIMIT] Redis health check failed:', error);
      return false;
    }
  }
}
