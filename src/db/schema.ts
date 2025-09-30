import { pgTable, text, timestamp, integer, boolean, varchar, serial } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';

// API Keys table
export const apiKeys = pgTable('api_keys', {
  id: serial('id').primaryKey(),
  cuid: varchar('cuid', { length: 128 }).notNull().unique().$defaultFn(() => createId()),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id),
  email: varchar('email', { length: 255 }).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsed: timestamp('last_used'),
  isActive: boolean('is_active').default(true).notNull(),
});

// API Usage tracking table
export const apiUsage = pgTable('api_usage', {
  id: serial('id').primaryKey(),
  cuid: varchar('cuid', { length: 128 }).notNull().unique().$defaultFn(() => createId()),
  apiKey: varchar('api_key', { length: 255 }).notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  requestId: varchar('request_id', { length: 255 }).notNull(),
  responseStatus: integer('response_status').notNull(),
  processingTimeMs: integer('processing_time_ms').notNull(),
});

// Rate Limits table
export const rateLimits = pgTable('rate_limits', {
  id: serial('id').primaryKey(),
  cuid: varchar('cuid', { length: 128 }).notNull().unique().$defaultFn(() => createId()),
  key: varchar('key', { length: 255 }).notNull().unique(),
  count: integer('count').default(1).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users table (for authentication)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  cuid: varchar('cuid', { length: 128 }).notNull().unique().$defaultFn(() => createId()),
  googleId: varchar('google_id', { length: 255 }).notNull().unique(), // Using existing user_id column
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  provider: varchar('provider', { length: 50 }).default('google').notNull(),
  providerId: varchar('provider_id', { length: 255 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true).notNull(),
});

// Terms of Service agreements table
export const tosAgreements = pgTable('tos_agreements', {
  id: serial('id').primaryKey(),
  cuid: varchar('cuid', { length: 128 }).notNull().unique().$defaultFn(() => createId()),
  userId: integer('user_id').notNull().references(() => users.id),
  tosHash: varchar('tos_hash', { length: 255 }).notNull(),
  tosVersion: varchar('tos_version', { length: 50 }).notNull(),
  agreedAt: timestamp('agreed_at').defaultNow().notNull(),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 support
  userAgent: text('user_agent'),
});

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  cuid: varchar('cuid', { length: 128 }).notNull().unique().$defaultFn(() => createId()),
  userId: integer('user_id').notNull().references(() => users.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
  planId: varchar('plan_id', { length: 50 }).notNull(), // 'free', 'pro', 'enterprise'
  status: varchar('status', { length: 50 }).notNull(), // 'active', 'canceled', 'past_due', etc.
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Settings table (key-value store)
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  cuid: varchar('cuid', { length: 128 }).notNull().unique().$defaultFn(() => createId()),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Create indexes for better performance
export const apiKeysUserIdIndex = apiKeys.userId;
export const apiKeysCuidIndex = apiKeys.cuid;
export const apiUsageApiKeyIndex = apiUsage.apiKey;
export const apiUsageUserIdIndex = apiUsage.userId;
export const apiUsageCuidIndex = apiUsage.cuid;
export const apiUsageTimestampIndex = apiUsage.timestamp;
export const rateLimitsKeyIndex = rateLimits.key;
export const rateLimitsCuidIndex = rateLimits.cuid;
export const rateLimitsExpiresAtIndex = rateLimits.expiresAt;
export const usersGoogleIdIndex = users.googleId;
export const usersCuidIndex = users.cuid;
export const usersEmailIndex = users.email;
export const usersStripeCustomerIdIndex = users.stripeCustomerId;
export const tosAgreementsUserIdIndex = tosAgreements.userId;
export const tosAgreementsCuidIndex = tosAgreements.cuid;
export const tosAgreementsAgreedAtIndex = tosAgreements.agreedAt;
export const subscriptionsUserIdIndex = subscriptions.userId;
export const subscriptionsCuidIndex = subscriptions.cuid;
export const subscriptionsStripeCustomerIdIndex = subscriptions.stripeCustomerId;
export const subscriptionsStripeSubscriptionIdIndex = subscriptions.stripeSubscriptionId;
export const subscriptionsStatusIndex = subscriptions.status;
export const settingsKeyIndex = settings.key;
export const settingsCuidIndex = settings.cuid;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  apiUsage: many(apiUsage),
  tosAgreements: many(tosAgreements),
  subscriptions: many(subscriptions),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  user: one(users, {
    fields: [apiUsage.userId],
    references: [users.id],
  }),
}));

export const tosAgreementsRelations = relations(tosAgreements, ({ one }) => ({
  user: one(users, {
    fields: [tosAgreements.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

