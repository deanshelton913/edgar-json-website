import { injectable, inject } from "tsyringe";
import { UsageDataAccess } from "@/data-access";
import { LoggingService } from "@/services/LoggingService";
import { PlanConfigurationService } from "@/services/PlanConfigurationService";
import { SubscriptionDataAccess } from "@/data-access/SubscriptionDataAccess";
import { RedisRateLimitService } from "@/services/RedisRateLimitService";

export interface UsageRecord {
  id?: number;
  cuid?: string;
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

@injectable()
export class UsageTrackingService {
  constructor(
    @inject("UsageDataAccess") private usageDataAccess: UsageDataAccess,
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("PlanConfigurationService") private planConfigService: PlanConfigurationService,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
    @inject("RedisRateLimitService") private redisRateLimitService: RedisRateLimitService,
  ) {}

  /**
   * Track API usage for billing and analytics
   */
  public async trackUsage(usageRecord: UsageRecord): Promise<void> {
    try {
      this.loggingService.debug(`Tracking usage for API key: ${usageRecord.apiKey}`);
      
      // Store usage record using UsageDataAccess
      await this.usageDataAccess.recordUsage(usageRecord);

      // Update rate limit counters using Redis
      await this.updateRateLimitCounters(usageRecord.apiKey);
      
      this.loggingService.debug(`Usage tracked successfully for API key: ${usageRecord.apiKey}`);
    } catch (error) {
      this.loggingService.error(`Error tracking usage: ${error}`);
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
   * Get usage statistics for an API key
   */
  public async getUsageStats(apiKey: string, userId: string, days: number = 30): Promise<{
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
  }> {
    try {
      const rawStats = await this.usageDataAccess.getUsageStats(apiKey, parseInt(userId), days);
      
      // Calculate period dates
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Calculate success rate
      const successRate = rawStats.totalRequests > 0 
        ? (rawStats.successfulRequests / rawStats.totalRequests) * 100 
        : 0;
      
      // Get endpoint statistics (simplified for now)
      const endpointStats: Record<string, { count: number; avgTime: number }> = {};
      
      return {
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days: days,
        },
        totalRequests: rawStats.totalRequests,
        successfulRequests: rawStats.successfulRequests,
        errorRequests: rawStats.failedRequests,
        successRate: successRate,
        averageResponseTimeMs: Math.round(rawStats.averageResponseTime),
        endpointStats: endpointStats,
      };
    } catch (error) {
      this.loggingService.error(`Error getting usage stats: ${error}`);
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

}
