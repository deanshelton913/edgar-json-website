import { Redis } from '@upstash/redis';

/**
 * Upstash Redis service that works in Edge Runtime (middleware)
 * Uses HTTP instead of TCP, so it's webpack-safe
 */
export class UpstashRedisService {
  private redis: Redis;

  constructor() {
    // Initialize Upstash Redis with environment variables
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      console.error('[UPSTASH_REDIS] Get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('[UPSTASH_REDIS] Set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('[UPSTASH_REDIS] Delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('[UPSTASH_REDIS] Exists error:', error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      console.error('[UPSTASH_REDIS] Increment error:', error);
      return 0;
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      console.error('[UPSTASH_REDIS] Expire error:', error);
      return false;
    }
  }
}
