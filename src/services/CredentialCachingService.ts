import { injectable, inject } from "tsyringe";
import { createClient, RedisClientType } from 'redis';
import type { LoggingService } from "@/services/LoggingService";

export interface CachedCredential {
  apiKey: string;
  userId: number;
  tier: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  expiresAt: Date;
}

export interface ApiKeyInfo {
  apiKey: string;
  userId: number;
  tier: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  isActive: boolean;
}

@injectable()
export class CredentialCachingService {
  private redis: RedisClientType | null = null;
  private isConnected = false;

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
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
      this.loggingService.debug(`[CREDENTIAL_CACHE] Redis URL: ${redisUrl}`);
      
      if (!redisUrl) {
        throw new Error('REDIS_URL environment variable is not set');
      }

      this.loggingService.debug(`[CREDENTIAL_CACHE] Connecting to Redis with URL: ${redisUrl}`);
      
      this.redis = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.loggingService.error('[CREDENTIAL_CACHE] Max reconnection attempts reached');
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.redis.on('error', (err) => {
        this.loggingService.error('[CREDENTIAL_CACHE] Redis error:', err);
        this.isConnected = false;
      });

      this.redis.on('connect', () => {
        this.loggingService.debug('[CREDENTIAL_CACHE] Connected to Redis');
        this.isConnected = true;
      });

      this.redis.on('disconnect', () => {
        this.loggingService.warn('[CREDENTIAL_CACHE] Disconnected from Redis');
        this.isConnected = false;
      });

      await this.redis.connect();
      
    } catch (error) {
      this.loggingService.error('[CREDENTIAL_CACHE] Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Cache API key credentials with TTL
   */
  public async cacheApiKeyCredentials(apiKeyInfo: ApiKeyInfo, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getApiKeyCacheKey(apiKeyInfo.apiKey);
      const credential: CachedCredential = {
        apiKey: apiKeyInfo.apiKey,
        userId: apiKeyInfo.userId,
        tier: apiKeyInfo.tier,
        requestsPerMinute: apiKeyInfo.requestsPerMinute,
        requestsPerDay: apiKeyInfo.requestsPerDay,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      };

      await this.redis.setEx(key, ttlSeconds, JSON.stringify(credential));
      
      this.loggingService.debug(`[CREDENTIAL_CACHE] Cached API key credentials for: ${apiKeyInfo.apiKey.substring(0, 10)}..., TTL: ${ttlSeconds}s`);
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error caching API key credentials: ${error}`);
      throw error;
    }
  }

  /**
   * Get cached API key credentials
   */
  public async getCachedApiKeyCredentials(apiKey: string): Promise<CachedCredential | null> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getApiKeyCacheKey(apiKey);
      const cached = await this.redis.get(key);
      
      if (!cached) {
        this.loggingService.debug(`[CREDENTIAL_CACHE] No cached credentials found for: ${apiKey.substring(0, 10)}...`);
        return null;
      }

      const credential: CachedCredential = JSON.parse(cached);
      
      // Check if credential has expired
      if (new Date() > credential.expiresAt) {
        this.loggingService.debug(`[CREDENTIAL_CACHE] Cached credentials expired for: ${apiKey.substring(0, 10)}...`);
        await this.redis.del(key);
        return null;
      }

      this.loggingService.debug(`[CREDENTIAL_CACHE] Retrieved cached credentials for: ${apiKey.substring(0, 10)}...`);
      return credential;
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error getting cached API key credentials: ${error}`);
      return null; // Return null on error to allow fallback to database
    }
  }

  /**
   * Invalidate cached API key credentials
   */
  public async invalidateApiKeyCredentials(apiKey: string): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getApiKeyCacheKey(apiKey);
      await this.redis.del(key);
      
      this.loggingService.debug(`[CREDENTIAL_CACHE] Invalidated cached credentials for: ${apiKey.substring(0, 10)}...`);
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error invalidating cached API key credentials: ${error}`);
      throw error;
    }
  }

  /**
   * Cache user session data
   */
  public async cacheUserSession(sessionId: string, sessionData: Record<string, unknown>, ttlSeconds: number = 86400): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getSessionCacheKey(sessionId);
      await this.redis.setEx(key, ttlSeconds, JSON.stringify(sessionData));
      
      this.loggingService.debug(`[CREDENTIAL_CACHE] Cached user session: ${sessionId}, TTL: ${ttlSeconds}s`);
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error caching user session: ${error}`);
      throw error;
    }
  }

  /**
   * Get cached user session data
   */
  public async getCachedUserSession(sessionId: string): Promise<Record<string, unknown> | null> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getSessionCacheKey(sessionId);
      const cached = await this.redis.get(key);
      
      if (!cached) {
        this.loggingService.debug(`[CREDENTIAL_CACHE] No cached session found for: ${sessionId}`);
        return null;
      }

      this.loggingService.debug(`[CREDENTIAL_CACHE] Retrieved cached session: ${sessionId}`);
      return JSON.parse(cached);
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error getting cached user session: ${error}`);
      return null;
    }
  }

  /**
   * Invalidate cached user session
   */
  public async invalidateUserSession(sessionId: string): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getSessionCacheKey(sessionId);
      await this.redis.del(key);
      
      this.loggingService.debug(`[CREDENTIAL_CACHE] Invalidated cached session: ${sessionId}`);
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error invalidating cached user session: ${error}`);
      throw error;
    }
  }

  /**
   * Cache rate limit configuration
   */
  public async cacheRateLimitConfig(apiKey: string, config: {
    requestsPerMinute: number;
    requestsPerDay: number;
  }, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getRateLimitConfigKey(apiKey);
      await this.redis.setEx(key, ttlSeconds, JSON.stringify(config));
      
      this.loggingService.debug(`[CREDENTIAL_CACHE] Cached rate limit config for: ${apiKey.substring(0, 10)}..., TTL: ${ttlSeconds}s`);
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error caching rate limit config: ${error}`);
      throw error;
    }
  }

  /**
   * Get cached rate limit configuration
   */
  public async getCachedRateLimitConfig(apiKey: string): Promise<{
    requestsPerMinute: number;
    requestsPerDay: number;
  } | null> {
    try {
      await this.ensureConnection();
      
      if (!this.redis) {
        throw new Error('Redis client not available');
      }

      const key = this.getRateLimitConfigKey(apiKey);
      const cached = await this.redis.get(key);
      
      if (!cached) {
        this.loggingService.debug(`[CREDENTIAL_CACHE] No cached rate limit config found for: ${apiKey.substring(0, 10)}...`);
        return null;
      }

      this.loggingService.debug(`[CREDENTIAL_CACHE] Retrieved cached rate limit config for: ${apiKey.substring(0, 10)}...`);
      return JSON.parse(cached);
    } catch (error) {
      this.loggingService.error(`[CREDENTIAL_CACHE] Error getting cached rate limit config: ${error}`);
      return null;
    }
  }

  /**
   * Generate API key cache key
   */
  private getApiKeyCacheKey(apiKey: string): string {
    return `api_key:${apiKey}`;
  }

  /**
   * Generate session cache key
   */
  private getSessionCacheKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  /**
   * Generate rate limit config cache key
   */
  private getRateLimitConfigKey(apiKey: string): string {
    return `rate_limit_config:${apiKey}`;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
        this.isConnected = false;
        this.loggingService.debug('[CREDENTIAL_CACHE] Redis connection closed');
      } catch (error) {
        this.loggingService.error('[CREDENTIAL_CACHE] Error closing Redis connection:', error);
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
      this.loggingService.error('[CREDENTIAL_CACHE] Redis health check failed:', error);
      return false;
    }
  }
}
