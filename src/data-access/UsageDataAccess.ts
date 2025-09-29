import { injectable, inject } from "tsyringe";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db, apiUsage, rateLimits } from "@/db";
import { LoggingService } from "@/services/LoggingService";

export interface UsageRecord {
  id?: number;
  cuid?: string;
  apiKey: string;
  userId: number; // Now references users.id
  endpoint: string;
  timestamp: Date;
  requestId: string;
  responseStatus: number;
  processingTimeMs: number;
}

@injectable()
export class UsageDataAccess {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  async recordUsage(usageData: UsageRecord): Promise<void> {
    try {
      this.loggingService.debug(`[USAGE_DATA_ACCESS] Recording usage for API key: ${usageData.apiKey.substring(0, 10)}...`);
      
      await db.insert(apiUsage).values({
        cuid: crypto.randomUUID(), // Generate a unique ID
        apiKey: usageData.apiKey,
        userId: usageData.userId,
        endpoint: usageData.endpoint,
        timestamp: usageData.timestamp,
        requestId: usageData.requestId,
        responseStatus: usageData.responseStatus,
        processingTimeMs: usageData.processingTimeMs,
      });
      
      this.loggingService.debug(`[USAGE_DATA_ACCESS] Successfully recorded usage for API key: ${usageData.apiKey.substring(0, 10)}...`);
    } catch (error) {
      this.loggingService.error(`[USAGE_DATA_ACCESS] Error recording usage: ${error}`);
      throw error;
    }
  }

  async getUsageStats(apiKey: string, userId: number, days: number = 30): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    requestsByDay: Array<{ date: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const result = await db
        .select()
        .from(apiUsage)
        .where(and(
          eq(apiUsage.apiKey, apiKey),
          eq(apiUsage.userId, userId),
          gte(apiUsage.timestamp, startDate)
        ))
        .orderBy(desc(apiUsage.timestamp));

      const totalRequests = result.length;
      const successfulRequests = result.filter(r => r.responseStatus >= 200 && r.responseStatus < 300).length;
      const failedRequests = totalRequests - successfulRequests;
      const averageResponseTime = totalRequests > 0 
        ? result.reduce((sum, r) => sum + r.processingTimeMs, 0) / totalRequests 
        : 0;

      // Group by day
      const requestsByDay = result.reduce((acc, record) => {
        const date = record.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const requestsByDayArray = Object.entries(requestsByDay).map(([date, count]) => ({
        date,
        count,
      }));

      return {
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        requestsByDay: requestsByDayArray,
      };
    } catch (error) {
      this.loggingService.error(`Error getting usage stats: ${error}`);
      throw error;
    }
  }

  async getRateLimitCount(key: string): Promise<number> {
    try {
      const result = await db
        .select()
        .from(rateLimits)
        .where(eq(rateLimits.key, key))
        .limit(1);

      return result.length > 0 ? result[0].count : 0;
    } catch (error) {
      this.loggingService.error(`Error getting rate limit count: ${error}`);
      throw error;
    }
  }

  async incrementRateLimitCount(key: string, ttlSeconds: number): Promise<void> {
    try {
      this.loggingService.debug(`[USAGE_DATA_ACCESS] Incrementing rate limit count for key: ${key}, TTL: ${ttlSeconds}s`);
      
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      
      await db.insert(rateLimits).values({
        cuid: crypto.randomUUID(), // Generate a unique ID
        key,
        count: 1,
        expiresAt,
      }).onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          count: rateLimits.count + 1,
          expiresAt,
        },
      });
      
      this.loggingService.debug(`[USAGE_DATA_ACCESS] Successfully incremented rate limit count for key: ${key}`);
    } catch (error) {
      this.loggingService.error(`[USAGE_DATA_ACCESS] Error incrementing rate limit count: ${error}`);
      throw error;
    }
  }
}
