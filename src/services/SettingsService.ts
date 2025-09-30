import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

export class SettingsService {
  /**
   * Get a setting value by key
   */
  static async get(key: string): Promise<string | null> {
    try {
      const result = await db
        .select({ value: settings.value })
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);
      
      return result[0]?.value || null;
    } catch (error) {
      console.error(`Error getting setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a setting value by key
   */
  static async set(key: string, value: string, description?: string): Promise<boolean> {
    try {
      await db
        .insert(settings)
        .values({
          key,
          value,
          description,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: settings.key,
          set: {
            value,
            description,
            updatedAt: new Date(),
          },
        });
      
      return true;
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all settings
   */
  static async getAll(): Promise<Record<string, string>> {
    try {
      const result = await db
        .select({ key: settings.key, value: settings.value })
        .from(settings);
      
      return result.reduce((acc, { key, value }) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
    } catch (error) {
      console.error('Error getting all settings:', error);
      return {};
    }
  }

  /**
   * Get Stripe price IDs for plans
   */
  static async getStripePriceIds(): Promise<{ pro?: string; enterprise?: string }> {
    const proPriceId = await this.get('stripe_pro_price_id');
    const enterprisePriceId = await this.get('stripe_enterprise_price_id');
    
    return {
      pro: proPriceId || undefined,
      enterprise: enterprisePriceId || undefined,
    };
  }
}
