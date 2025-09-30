import { injectable, inject } from "tsyringe";
import type { LoggingService } from "@/services/LoggingService";
import { ApiKeyDataAccess } from "@/services/data-access/ApiKeyDataAccess";
import { SubscriptionDataAccess } from "@/services/data-access/SubscriptionDataAccess";
import { PlanConfigurationService } from "@/services/PlanConfigurationService";
import { getRedisManager } from "@/lib/redis";

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
  private readonly CACHE_TTL = 300; // 5 minutes cache TTL

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("ApiKeyDataAccess") private apiKeyDataAccess: ApiKeyDataAccess,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
    @inject("PlanConfigurationService") private planConfigService: PlanConfigurationService,
  ) {}

  public async isHealthy(): Promise<boolean> {
    try {
      const client = await getRedisManager().getClient();
      await client.ping();
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
      const client = await getRedisManager().getClient();

      const cacheKey = `api_key:${apiKey}`;
      
      // Try to get from cache first
      const cachedData = await client.get(cacheKey);
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
      await client.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(apiKeyInfo));
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
      const client = await getRedisManager().getClient();
      const cacheKey = `api_key:${apiKey}`;
      await client.del(cacheKey);
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
      const client = await getRedisManager().getClient();
      const cacheKey = `api_key:${apiKeyInfo.apiKey}`;
      await client.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(apiKeyInfo));
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
    const planLimits = this.planConfigService.getUserPlanLimitsWithSubscription(
      subscription?.status || null,
      subscription?.planId || null,
      subscription?.cancelAtPeriodEnd || null,
      subscription?.currentPeriodEnd || null
    );

    return {
      requestsPerMinute: planLimits.requestsPerMinute,
      requestsPerDay: planLimits.requestsPerDay,
    };
  }
}
