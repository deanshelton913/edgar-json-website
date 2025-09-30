import { injectable, inject } from "tsyringe";
import type { LoggingService } from "../LoggingService";

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
export class MockUsageTrackingService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  async trackUsage(usageRecord: UsageRecord): Promise<void> {
    // Mock implementation - just log the usage
    this.loggingService.info(`[MOCK_USAGE_TRACKING] Tracking usage for user ${usageRecord.userId}: ${usageRecord.endpoint}`);
  }

  async getUsageStats(apiKey: string, userId: string, days: number = 30): Promise<UsageStats> {
    // Mock implementation - return fake data matching the real interface
    this.loggingService.info(`[MOCK_USAGE_TRACKING] Getting usage stats for API key ${apiKey}, user ${userId} (${days} days)`);
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: days,
      },
      totalRequests: 150,
      successfulRequests: 147,
      errorRequests: 3,
      successRate: 0.98,
      averageResponseTimeMs: 250,
      endpointStats: {
        '/api/v1/filings': { count: 45, avgTime: 200 },
        '/api/parse': { count: 30, avgTime: 300 },
        '/api/v1/usage': { count: 25, avgTime: 150 },
        '/api/v1/filings/[cik]/[accession]/[filename]': { count: 50, avgTime: 180 },
      },
    };
  }

  async checkRateLimit(apiKey: string, userId: string): Promise<RateLimitInfo> {
    // Mock implementation - return fake rate limit info
    this.loggingService.info(`[MOCK_USAGE_TRACKING] Checking rate limit for API key ${apiKey}, user ${userId}`);
    
    return {
      requestsPerMinute: 100,
      requestsPerDay: 10000,
      currentMinuteCount: 15,
      currentDayCount: 150,
      resetTimeMinute: new Date(Date.now() + 60 * 1000).toISOString(),
      resetTimeDay: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isLimited: false,
    };
  }
}
