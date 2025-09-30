import { injectable } from "tsyringe";

export interface PlanLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  tier: string;
}

@injectable()
export class PlanConfigurationService {
  private readonly planConfigurations: Record<string, PlanLimits> = {
    'free': {
      requestsPerMinute: 10,
      requestsPerDay: 100,
      tier: 'free'
    },
    'pro': {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
      tier: 'pro'
    },
    'enterprise': {
      requestsPerMinute: 300,
      requestsPerDay: 100000,
      tier: 'enterprise'
    }
  };

  /**
   * Get plan limits for a given plan ID
   */
  getPlanLimits(planId: string): PlanLimits {
    return this.planConfigurations[planId] || this.planConfigurations['free'];
  }

  /**
   * Get plan limits for a user based on their subscription status
   * If no active subscription, returns free tier limits
   */
  getUserPlanLimits(subscriptionStatus: string | null, planId: string | null): PlanLimits {
    // If user has an active subscription, use their plan
    if (subscriptionStatus === 'active' && planId) {
      return this.getPlanLimits(planId);
    }
    
    // Default to free tier for inactive/no subscription
    return this.planConfigurations['free'];
  }

  /**
   * Get plan limits for a user based on their subscription details
   * This method checks if a canceled subscription period has ended
   */
  getUserPlanLimitsWithSubscription(
    subscriptionStatus: string | null, 
    planId: string | null,
    cancelAtPeriodEnd: boolean | null,
    currentPeriodEnd: Date | null
  ): PlanLimits {
    // If user has an active subscription, check if it's still valid
    if (subscriptionStatus === 'active' && planId) {
      // If subscription is canceled at period end, check if period has ended
      if (cancelAtPeriodEnd && currentPeriodEnd) {
        const now = new Date();
        if (now >= currentPeriodEnd) {
          // Period has ended, fall back to free tier
          return this.planConfigurations['free'];
        }
      }
      // Still within period, use their plan
      return this.getPlanLimits(planId);
    }
    
    // Default to free tier for inactive/no subscription
    return this.planConfigurations['free'];
  }

  /**
   * Check if a plan ID is valid
   */
  isValidPlan(planId: string): boolean {
    return planId in this.planConfigurations;
  }

  /**
   * Get all available plans
   */
  getAllPlans(): Record<string, PlanLimits> {
    return { ...this.planConfigurations };
  }
}
