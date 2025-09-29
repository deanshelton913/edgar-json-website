import { injectable, inject } from "tsyringe";
import { eq, and, sql } from "drizzle-orm";
import { db, apiKeys } from "@/db";
import { LoggingService } from "@/services/LoggingService";

export interface ApiKeyData {
  id?: number;
  cuid?: string;
  apiKey: string;
  userId: number; // Now references users.id
  email: string;
  usageCount: number;
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

@injectable()
export class ApiKeyDataAccess {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  async createApiKey(apiKeyData: Omit<ApiKeyData, 'createdAt' | 'lastUsed'>): Promise<ApiKeyData> {
    try {
      const result = await db.insert(apiKeys).values({
        apiKey: apiKeyData.apiKey,
        userId: apiKeyData.userId,
        email: apiKeyData.email,
        usageCount: apiKeyData.usageCount,
        isActive: apiKeyData.isActive,
      }).returning();

      const created = result[0];
      return {
        id: created.id,
        cuid: created.cuid,
        apiKey: created.apiKey,
        userId: created.userId,
        email: created.email,
        usageCount: created.usageCount,
        createdAt: created.createdAt,
        lastUsed: created.lastUsed || undefined,
        isActive: created.isActive,
      };
    } catch (error) {
      this.loggingService.error(`Error creating API key: ${error}`);
      throw error;
    }
  }

  async getApiKeyByUserId(userId: number): Promise<ApiKeyData | null> {
    try {
      const result = await db
        .select()
        .from(apiKeys)
        .where(and(
          eq(apiKeys.userId, userId),
          eq(apiKeys.isActive, true)
        ))
        .limit(1);

      if (result.length > 0) {
        const apiKey = result[0];
        return {
          id: apiKey.id,
          cuid: apiKey.cuid,
          apiKey: apiKey.apiKey,
          userId: apiKey.userId,
          email: apiKey.email,
          usageCount: apiKey.usageCount,
          createdAt: apiKey.createdAt,
          lastUsed: apiKey.lastUsed || undefined,
          isActive: apiKey.isActive,
        };
      }
      return null;
    } catch (error) {
      this.loggingService.error(`Error getting API key by user ID: ${error}`);
      throw error;
    }
  }

  async getApiKeyByKey(apiKey: string): Promise<ApiKeyData | null> {
    try {
      const result = await db
        .select()
        .from(apiKeys)
        .where(and(
          eq(apiKeys.apiKey, apiKey),
          eq(apiKeys.isActive, true)
        ))
        .limit(1);

      if (result.length > 0) {
        const key = result[0];
        return {
          id: key.id,
          cuid: key.cuid,
          apiKey: key.apiKey,
          userId: key.userId,
          email: key.email,
          usageCount: key.usageCount,
          createdAt: key.createdAt,
          lastUsed: key.lastUsed || undefined,
          isActive: key.isActive,
        };
      }
      return null;
    } catch (error) {
      this.loggingService.error(`Error getting API key by key: ${error}`);
      throw error;
    }
  }

  async updateUsageCount(apiKey: string): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({
          usageCount: sql`${apiKeys.usageCount} + 1`,
          lastUsed: new Date(),
        })
        .where(eq(apiKeys.apiKey, apiKey));
    } catch (error) {
      this.loggingService.error(`Error updating usage count: ${error}`);
      throw error;
    }
  }

  async deactivateApiKey(apiKey: string): Promise<void> {
    try {
      await db
        .update(apiKeys)
        .set({
          isActive: false,
        })
        .where(eq(apiKeys.apiKey, apiKey));
    } catch (error) {
      this.loggingService.error(`Error deactivating API key: ${error}`);
      throw error;
    }
  }

  async deleteApiKeyByUserId(userId: number): Promise<void> {
    try {
      await db
        .delete(apiKeys)
        .where(eq(apiKeys.userId, userId));
    } catch (error) {
      this.loggingService.error(`Error deleting API key by user ID: ${error}`);
      throw error;
    }
  }

}
