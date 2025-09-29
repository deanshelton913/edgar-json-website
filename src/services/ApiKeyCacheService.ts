import { injectable, inject } from "tsyringe";
import { createClient, RedisClientType } from 'redis';
import type { LoggingService } from "./LoggingService";
import { ApiKeyDataAccess } from "@/data-access/ApiKeyDataAccess";
import { SubscriptionDataAccess } from "@/data-access/SubscriptionDataAccess";
import { PlanConfigurationService } from "./PlanConfigurationService";

export interface ApiKeyInfo {
  id: number;
  cuid: string;
  apiKey: string;
  userId: number;
  email: string;
  usageCount: number;
  createdAt: Date;
  lastUsed: Date | null;
  isActive: boolean;
}

@injectable()
export class ApiKeyCacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private readonly CACHE_TTL = 300; // 5 minutes cache TTL

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("ApiKeyDataAccess") private apiKeyDataAccess: ApiKeyDataAccess,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
    @inject("PlanConfigurationService") private planConfigService: PlanConfigurationService,
  ) {
    const redisUrl = process.env.REDIS_URL;
    this.loggingService.debug(`[API_KEY_CACHE] Redis URL: ${redisUrl}`);
    
    if (!redisUrl) {
      this.loggingService.error('[API_KEY_CACHE] REDIS_URL environment variable is not set.');
      throw new Error('REDIS_URL environment variable is not set.');
    }

    this.loggingService.debug(`[API_KEY_CACHE] Creating Redis client with URL: ${redisUrl}`);
    this.client = createClient({ url: redisUrl });

    this.client.on('error', (err) => {
      this.loggingService.error('[API_KEY_CACHE] Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.loggingService.debug('[API_KEY_CACHE] Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('end', () => {
      this.loggingService.debug('[API_KEY_CACHE] Disconnected from Redis');
      this.isConnected = false;
    });

    this.connect();
  }

  private async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        if (!this.client.isOpen) {
          this.loggingService.debug('[API_KEY_CACHE] Connecting to Redis...');
          await this.client.connect();
        }
        this.isConnected = true;
        resolve();
      } catch (error) {
        this.loggingService.error('[API_KEY_CACHE] Failed to connect to Redis:', error);
        this.isConnected = false;
        reject(error);
      } finally {
        this.connectionPromise = null;
      }
    });
    return this.connectionPromise;
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.connect();
      await this.client.ping();
      return true;
    } catch (error) {
      this.loggingService.error('[API_KEY_CACHE] Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get API key info with read-through caching
   */
  public async getApiKeyInfo(apiKey: string): Promise<ApiKeyInfo | null> {
    try {
      await this.connect();

      const cacheKey = `api_key:${apiKey}`;
      
      // Try to get from cache first
      const cachedData = await this.client.get(cacheKey);
      if (cachedData) {
        this.loggingService.debug(`[API_KEY_CACHE] Cache hit for API key: ${apiKey}`);
        return JSON.parse(cachedData) as ApiKeyInfo;
      }

      // Cache miss - fetch from database
      this.loggingService.debug(`[API_KEY_CACHE] Cache miss for API key: ${apiKey}, fetching from DB`);
      const apiKeyData = await this.apiKeyDataAccess.getApiKeyByKey(apiKey);
      
      if (!apiKeyData) {
        this.loggingService.warn(`[API_KEY_CACHE] API key not found: ${apiKey}`);
        return null;
      }

      // Convert to ApiKeyInfo format
      const apiKeyInfo: ApiKeyInfo = {
        id: apiKeyData.id!,
        cuid: apiKeyData.cuid!,
        apiKey: apiKeyData.apiKey,
        userId: apiKeyData.userId,
        email: apiKeyData.email,
        usageCount: apiKeyData.usageCount,
        createdAt: apiKeyData.createdAt,
        lastUsed: apiKeyData.lastUsed || null,
        isActive: apiKeyData.isActive,
      };

      // Cache the result
      await this.client.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(apiKeyInfo));
      this.loggingService.debug(`[API_KEY_CACHE] Cached API key info for: ${apiKey}`);

      return apiKeyInfo;
    } catch (error) {
      this.loggingService.error(`[API_KEY_CACHE] Error getting API key info for ${apiKey}:`, error);
      
      // Fallback to database if Redis fails
      try {
        const apiKeyData = await this.apiKeyDataAccess.getApiKeyByKey(apiKey);
        if (!apiKeyData) {
          return null;
        }

        return {
          id: apiKeyData.id!,
          cuid: apiKeyData.cuid!,
          apiKey: apiKeyData.apiKey,
          userId: apiKeyData.userId,
          email: apiKeyData.email,
          usageCount: apiKeyData.usageCount,
          createdAt: apiKeyData.createdAt,
          lastUsed: apiKeyData.lastUsed || null,
          isActive: apiKeyData.isActive,
        };
      } catch (dbError) {
        this.loggingService.error(`[API_KEY_CACHE] Database fallback failed for ${apiKey}:`, dbError);
        return null;
      }
    }
  }

  /**
   * Invalidate cache for a specific API key
   */
  public async invalidateApiKey(apiKey: string): Promise<void> {
    try {
      await this.connect();
      const cacheKey = `api_key:${apiKey}`;
      await this.client.del(cacheKey);
      this.loggingService.debug(`[API_KEY_CACHE] Invalidated cache for API key: ${apiKey}`);
    } catch (error) {
      this.loggingService.error(`[API_KEY_CACHE] Error invalidating cache for ${apiKey}:`, error);
    }
  }

  /**
   * Update API key info in cache (after database update)
   */
  public async updateApiKeyInCache(apiKeyInfo: ApiKeyInfo): Promise<void> {
    try {
      await this.connect();
      const cacheKey = `api_key:${apiKeyInfo.apiKey}`;
      await this.client.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(apiKeyInfo));
      this.loggingService.debug(`[API_KEY_CACHE] Updated cache for API key: ${apiKeyInfo.apiKey}`);
    } catch (error) {
      this.loggingService.error(`[API_KEY_CACHE] Error updating cache for ${apiKeyInfo.apiKey}:`, error);
    }
  }

  /**
   * Get rate limit config for an API key
   */
  public async getRateLimitConfig(apiKey: string): Promise<{ requestsPerMinute: number; requestsPerDay: number } | null> {
    const apiKeyInfo = await this.getApiKeyInfo(apiKey);
    if (!apiKeyInfo || !apiKeyInfo.isActive) {
      return null;
    }

    // Get user's subscription to determine rate limits
    const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(apiKeyInfo.userId);
    const planLimits = this.planConfigService.getUserPlanLimits(
      subscription?.status || null,
      subscription?.planId || null
    );

    return {
      requestsPerMinute: planLimits.requestsPerMinute,
      requestsPerDay: planLimits.requestsPerDay,
    };
  }
}
