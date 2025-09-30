import { injectable, inject } from "tsyringe";
import { ApiKeyDataAccess, ApiKeyData } from "@/services/data-access/ApiKeyDataAccess";
import { SubscriptionDataAccess } from "@/services/data-access/SubscriptionDataAccess";
import { PlanConfigurationService } from "@/services/PlanConfigurationService";
import { LoggingService } from "@/services/LoggingService";

export interface ApiKeyWithTierData extends ApiKeyData {
  currentTier: string;
  requestsPerMinute: number;
  requestsPerDay: number;
  subscriptionStatus?: string;
}

@injectable()
export class ApiKeyService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("ApiKeyDataAccess") private apiKeyDataAccess: ApiKeyDataAccess,
    @inject("SubscriptionDataAccess") private subscriptionDataAccess: SubscriptionDataAccess,
    @inject("PlanConfigurationService") private planConfigService: PlanConfigurationService,
  ) {}

  /**
   * Get API key with tier information based on user's subscription
   */
  async getApiKeyWithTier(userId: number): Promise<ApiKeyWithTierData | null> {
    try {
      // Get the API key
      const apiKey = await this.apiKeyDataAccess.getApiKeyByUserId(userId);
      if (!apiKey) {
        return null;
      }

      // Get user's subscription
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(userId);
      
      // Determine tier and limits based on subscription
      const planLimits = this.planConfigService.getUserPlanLimitsWithSubscription(
        subscription?.status || null,
        subscription?.planId || null,
        subscription?.cancelAtPeriodEnd || null,
        subscription?.currentPeriodEnd || null
      );

      return {
        ...apiKey,
        currentTier: planLimits.tier,
        requestsPerMinute: planLimits.requestsPerMinute,
        requestsPerDay: planLimits.requestsPerDay,
        subscriptionStatus: subscription?.status,
      };
    } catch (error) {
      this.loggingService.error(`[API_KEY_SERVICE] Error getting API key with tier: ${error}`);
      throw error;
    }
  }

  /**
   * Get API key by key string with tier information
   */
  async getApiKeyByKeyWithTier(apiKeyString: string): Promise<ApiKeyWithTierData | null> {
    try {
      // Get the API key
      const apiKey = await this.apiKeyDataAccess.getApiKeyByKey(apiKeyString);
      if (!apiKey) {
        return null;
      }

      // Get user's subscription
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(apiKey.userId);
      
      // Determine tier and limits based on subscription
      const planLimits = this.planConfigService.getUserPlanLimitsWithSubscription(
        subscription?.status || null,
        subscription?.planId || null,
        subscription?.cancelAtPeriodEnd || null,
        subscription?.currentPeriodEnd || null
      );

      return {
        ...apiKey,
        currentTier: planLimits.tier,
        requestsPerMinute: planLimits.requestsPerMinute,
        requestsPerDay: planLimits.requestsPerDay,
        subscriptionStatus: subscription?.status,
      };
    } catch (error) {
      this.loggingService.error(`[API_KEY_SERVICE] Error getting API key by key with tier: ${error}`);
      throw error;
    }
  }

  /**
   * Create API key with tier information based on user's subscription
   */
  async createApiKeyWithTier(userId: number, email: string): Promise<ApiKeyWithTierData> {
    try {
      // Generate API key
      const apiKeyString = this.generateApiKey();
      
      // Create the API key
      const apiKey = await this.apiKeyDataAccess.createApiKey({
        apiKey: apiKeyString,
        userId: userId,
        email: email,
        usageCount: 0,
        isActive: true,
      });

      // Get user's subscription to determine tier
      const subscription = await this.subscriptionDataAccess.getSubscriptionByUserId(userId);
      
      // Determine tier and limits based on subscription
      const planLimits = this.planConfigService.getUserPlanLimitsWithSubscription(
        subscription?.status || null,
        subscription?.planId || null,
        subscription?.cancelAtPeriodEnd || null,
        subscription?.currentPeriodEnd || null
      );

      return {
        ...apiKey,
        currentTier: planLimits.tier,
        requestsPerMinute: planLimits.requestsPerMinute,
        requestsPerDay: planLimits.requestsPerDay,
        subscriptionStatus: subscription?.status,
      };
    } catch (error) {
      this.loggingService.error(`[API_KEY_SERVICE] Error creating API key with tier: ${error}`);
      throw error;
    }
  }

  /**
   * Generate a secure API key
   */
  private generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `edgar_${result}`;
  }
}
