import { injectable, inject } from "tsyringe";
import { LoggingService } from "@/services/LoggingService";
import { PlanConfigurationService } from "@/services/PlanConfigurationService";
import { SubscriptionDataAccess } from "@/services/data-access/SubscriptionDataAccess";
import { RedisRateLimitService } from "./RedisRateLimitService";
import { getRedisManager } from "@/lib/redis";

export interface UsageRecord {
  apiKey: string;
  userId: number;
  endpoint: string;
  timestamp: Date;
  requestId: string;
  responseStatus: number;
  processingTimeMs: number;
}

export interface RateLimitInfo {
  requestsPerMinute: number;
  requestsPerDay: number;
  currentMinuteCount: number;
  currentDayCount: number;
  resetTimeMinute: string;
  resetTimeDay: string;
  isLimited: boolean;
}

export interface UsageStats {
  period: {
    start: string;
    end: string;
    days: number;
  };
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  successRate: number;
  averageResponseTimeMs: number;
  endpointStats: Record<string, {
    count: number;
    avgTime: number;
  }>;
}

@injectable()
export class UsageTrackingService {
  private isConnected = false;

  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("PlanConfigurationService") private planConfigService: PlanConfigurationService,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
    @inject("RedisRateLimitService") private redisRateLimitService: RedisRateLimitService,
  ) {}

  /**
   * Track API usage for billing and analytics using Redis only
   */
  public async trackUsage(usageRecord: UsageRecord): Promise<void> {
    try {
      const client = await getRedisManager().getClient();
      
      if (!client) {
        throw new Error('Redis client not available');
      }

      this.loggingService.debug(`[USAGE_TRACKING] Tracking usage for API key: ${usageRecord.apiKey.substring(0, 10)}...`);
      
      const timestamp = usageRecord.timestamp;
      const dayKey = this.getUsageDayKey(usageRecord.apiKey, timestamp);
      const hourKey = this.getUsageHourKey(usageRecord.apiKey, timestamp);
      const endpointKey = this.getUsageEndpointKey(usageRecord.apiKey, usageRecord.endpoint, timestamp);

      // Store usage data in Redis with appropriate TTLs
      const pipeline = client.multi();
      
      // Store daily usage summary
      pipeline.hIncrBy(dayKey, 'totalRequests', 1);
      pipeline.hIncrBy(dayKey, 'successfulRequests', usageRecord.responseStatus >= 200 && usageRecord.responseStatus < 300 ? 1 : 0);
      pipeline.hIncrBy(dayKey, 'errorRequests', usageRecord.responseStatus >= 400 ? 1 : 0);
      pipeline.hIncrByFloat(dayKey, 'totalProcessingTime', usageRecord.processingTimeMs);
      pipeline.expire(dayKey, 86400 * 90); // Keep for 90 days

      // Store hourly usage summary
      pipeline.hIncrBy(hourKey, 'totalRequests', 1);
      pipeline.hIncrBy(hourKey, 'successfulRequests', usageRecord.responseStatus >= 200 && usageRecord.responseStatus < 300 ? 1 : 0);
      pipeline.hIncrBy(hourKey, 'errorRequests', usageRecord.responseStatus >= 400 ? 1 : 0);
      pipeline.hIncrByFloat(hourKey, 'totalProcessingTime', usageRecord.processingTimeMs);
      pipeline.expire(hourKey, 86400 * 7); // Keep for 7 days

      // Store endpoint-specific usage
      pipeline.hIncrBy(endpointKey, 'count', 1);
      pipeline.hIncrByFloat(endpointKey, 'totalTime', usageRecord.processingTimeMs);
      pipeline.expire(endpointKey, 86400 * 30); // Keep for 30 days

      await pipeline.exec();

      // Update rate limit counters using Redis
      await this.updateRateLimitCounters(usageRecord.apiKey);
      
      this.loggingService.debug(`[USAGE_TRACKING] Usage tracked successfully for API key: ${usageRecord.apiKey.substring(0, 10)}...`);
    } catch (error) {
      this.loggingService.error(`[USAGE_TRACKING] Error tracking usage: ${error}`);
      throw error;
    }
  }

  /**
   * Check if API key has exceeded rate limits
   */
  public async checkRateLimit(apiKey: string, userId: string): Promise<RateLimitInfo> {
    try {
      // Get user's subscription to determine rate limits
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(parseInt(userId));
      const planLimits = this.planConfigService.getUserPlanLimits(
        subscription?.status || null,
        subscription?.planId || null
      );

      this.loggingService.debug(`[USAGE_TRACKING] Checking rate limits for API key: ${apiKey.substring(0, 10)}..., User ID: ${userId}`);
      this.loggingService.debug(`[USAGE_TRACKING] Plan limits: ${planLimits.requestsPerMinute}/min, ${planLimits.requestsPerDay}/day`);

      // Use Redis for rate limiting
      const rateLimitInfo = await this.redisRateLimitService.checkRateLimit(apiKey);

      this.loggingService.debug(`[USAGE_TRACKING] Rate limit check result: ${rateLimitInfo.isLimited ? 'LIMITED' : 'ALLOWED'}`);
      this.loggingService.debug(`[USAGE_TRACKING] Current counts: ${rateLimitInfo.currentMinuteCount}/${rateLimitInfo.requestsPerMinute} per minute, ${rateLimitInfo.currentDayCount}/${rateLimitInfo.requestsPerDay} per day`);

      return rateLimitInfo;
    } catch (error) {
      this.loggingService.error(`[USAGE_TRACKING] Error checking rate limit: ${error}`);
      throw error;
    }
  }

  /**
   * Get usage statistics for an API key from Redis
   */
  public async getUsageStats(apiKey: string, userId: string, days: number = 30): Promise<UsageStats> {
    try {
      const client = await getRedisManager().getClient();
      
      if (!client) {
        throw new Error('Redis client not available');
      }

      this.loggingService.debug(`[USAGE_TRACKING] Getting usage stats for API key: ${apiKey.substring(0, 10)}..., days: ${days}`);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let totalRequests = 0;
      let successfulRequests = 0;
      let errorRequests = 0;
      let totalProcessingTime = 0;
      const endpointStats: Record<string, { count: number; avgTime: number }> = {};

      // Get usage data for each day in the range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayKey = this.getUsageDayKey(apiKey, d);
        const dayData = await client.hGetAll(dayKey);
        
        if (dayData.totalRequests) {
          totalRequests += parseInt(dayData.totalRequests);
          successfulRequests += parseInt(dayData.successfulRequests || '0');
          errorRequests += parseInt(dayData.errorRequests || '0');
          totalProcessingTime += parseFloat(dayData.totalProcessingTime || '0');
        }
      }

      // Get endpoint statistics for the last 30 days
      const endpointKeys = await this.getEndpointKeys(apiKey, 30);
      for (const endpointKey of endpointKeys) {
        const endpointData = await client.hGetAll(endpointKey);
        if (endpointData.count) {
          const count = parseInt(endpointData.count);
          const totalTime = parseFloat(endpointData.totalTime || '0');
          const avgTime = count > 0 ? totalTime / count : 0;
          
          // Extract endpoint name from key
          const endpointName = endpointKey.split(':').slice(-2, -1)[0];
          endpointStats[endpointName] = { count, avgTime };
        }
      }

      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      const averageResponseTimeMs = totalRequests > 0 ? totalProcessingTime / totalRequests : 0;

      return {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: days,
        },
        totalRequests,
        successfulRequests,
        errorRequests,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimal places
        averageResponseTimeMs: Math.round(averageResponseTimeMs),
        endpointStats,
      };
    } catch (error) {
      this.loggingService.error(`[USAGE_TRACKING] Error getting usage stats: ${error}`);
      throw error;
    }
  }

  /**
   * Update rate limit counters using Redis
   */
  private async updateRateLimitCounters(apiKey: string): Promise<void> {
    try {
      this.loggingService.debug(`[USAGE_TRACKING] Updating rate limit counters for API key: ${apiKey.substring(0, 10)}...`);

      // Use Redis to increment rate limit counters
      await this.redisRateLimitService.incrementRateLimit(apiKey);
      
      this.loggingService.debug(`[USAGE_TRACKING] Rate limit counters updated successfully`);
    } catch (error) {
      this.loggingService.error(`[USAGE_TRACKING] Error updating rate limit counters: ${error}`);
      throw error;
    }
  }

  /**
   * Generate usage day key for Redis
   */
  private getUsageDayKey(apiKey: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `usage:${apiKey}:day:${year}-${month}-${day}`;
  }

  /**
   * Generate usage hour key for Redis
   */
  private getUsageHourKey(apiKey: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    
    return `usage:${apiKey}:hour:${year}-${month}-${day}:${hour}`;
  }

  /**
   * Generate usage endpoint key for Redis
   */
  private getUsageEndpointKey(apiKey: string, endpoint: string, date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `usage:${apiKey}:endpoint:${endpoint}:${year}-${month}-${day}`;
  }

  /**
   * Get endpoint keys for a given number of days
   */
  private async getEndpointKeys(apiKey: string, days: number): Promise<string[]> {
    const client = await getRedisManager().getClient();
    if (!client) {
      return [];
    }

    const keys: string[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const pattern = `usage:${apiKey}:endpoint:*:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayKeys = await client.keys(pattern);
      keys.push(...dayKeys);
    }

    return keys;
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = await getRedisManager().getClient();
      await client.ping();
      return true;
    } catch (error) {
      this.loggingService.error('[USAGE_TRACKING] Redis health check failed:', error);
      return false;
    }
  }
}