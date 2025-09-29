import { injectable, inject } from "tsyringe";
import { eq, desc } from "drizzle-orm";
import { db, subscriptions } from "@/db";
import { LoggingService } from "@/services/LoggingService";

export interface SubscriptionData {
  id?: number;
  cuid?: string;
  userId: number;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class SubscriptionDataAccess {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  async createSubscription(subscriptionData: Omit<SubscriptionData, 'id' | 'cuid' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionData> {
    try {
      const result = await db.insert(subscriptions).values({
        userId: subscriptionData.userId,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        planId: subscriptionData.planId,
        status: subscriptionData.status,
        currentPeriodStart: subscriptionData.currentPeriodStart,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
        canceledAt: subscriptionData.canceledAt,
      }).returning();

      const subscription = result[0];
      this.loggingService.debug(`[SUBSCRIPTION_DAL] Created subscription: ${subscription.id} for user: ${subscription.userId}`);
      
      return {
        id: subscription.id,
        cuid: subscription.cuid,
        userId: subscription.userId,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        planId: subscription.planId,
        status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid',
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt || undefined,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      };
    } catch (error) {
      this.loggingService.error(`[SUBSCRIPTION_DAL] Error creating subscription: ${error}`);
      throw error;
    }
  }

  async getSubscriptionByUserId(userId: number): Promise<SubscriptionData | null> {
    try {
      const result = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      if (result.length > 0) {
        const subscription = result[0];
        return {
          id: subscription.id,
          cuid: subscription.cuid,
          userId: subscription.userId,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          planId: subscription.planId,
          status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid',
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canceledAt: subscription.canceledAt || undefined,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        };
      }
      return null;
    } catch (error) {
      this.loggingService.error(`[SUBSCRIPTION_DAL] Error getting subscription by user ID: ${error}`);
      throw error;
    }
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<SubscriptionData | null> {
    try {
      const result = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
        .limit(1);

      if (result.length > 0) {
        const subscription = result[0];
        return {
          id: subscription.id,
          cuid: subscription.cuid,
          userId: subscription.userId,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          planId: subscription.planId,
          status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid',
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          canceledAt: subscription.canceledAt || undefined,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
        };
      }
      return null;
    } catch (error) {
      this.loggingService.error(`[SUBSCRIPTION_DAL] Error getting subscription by Stripe ID: ${error}`);
      throw error;
    }
  }

  async updateSubscriptionStatus(
    stripeSubscriptionId: string, 
    status: SubscriptionData['status'],
    currentPeriodStart?: Date,
    currentPeriodEnd?: Date,
    cancelAtPeriodEnd?: boolean,
    canceledAt?: Date
  ): Promise<void> {
    try {
      const updateData: Partial<SubscriptionData> = {
        status,
        updatedAt: new Date(),
      };

      if (currentPeriodStart) updateData.currentPeriodStart = currentPeriodStart;
      if (currentPeriodEnd) updateData.currentPeriodEnd = currentPeriodEnd;
      if (cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
      if (canceledAt) updateData.canceledAt = canceledAt;

      await db
        .update(subscriptions)
        .set(updateData)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

      this.loggingService.debug(`[SUBSCRIPTION_DAL] Updated subscription status: ${stripeSubscriptionId} to ${status}`);
    } catch (error) {
      this.loggingService.error(`[SUBSCRIPTION_DAL] Error updating subscription status: ${error}`);
      throw error;
    }
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    try {
      await db
        .update(subscriptions)
        .set({
          status: 'canceled',
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

      this.loggingService.debug(`[SUBSCRIPTION_DAL] Canceled subscription: ${stripeSubscriptionId}`);
    } catch (error) {
      this.loggingService.error(`[SUBSCRIPTION_DAL] Error canceling subscription: ${error}`);
      throw error;
    }
  }

  async deleteSubscription(stripeSubscriptionId: string): Promise<void> {
    try {
      await db
        .delete(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

      this.loggingService.debug(`[SUBSCRIPTION_DAL] Deleted subscription: ${stripeSubscriptionId}`);
    } catch (error) {
      this.loggingService.error(`[SUBSCRIPTION_DAL] Error deleting subscription: ${error}`);
      throw error;
    }
  }

  async getActiveSubscriptionsByUserId(userId: number): Promise<SubscriptionData[]> {
    try {
      const result = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      return result.map(subscription => ({
        id: subscription.id,
        cuid: subscription.cuid,
        userId: subscription.userId,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        planId: subscription.planId,
        status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid',
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt || undefined,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      }));
    } catch (error) {
      this.loggingService.error(`[SUBSCRIPTION_DAL] Error getting active subscriptions by user ID: ${error}`);
      throw error;
    }
  }
}
