-- Remove tier and rate limit fields from api_keys table
-- These are now managed by the subscriptions table and PlanConfigurationService

ALTER TABLE api_keys 
DROP COLUMN IF EXISTS current_tier,
DROP COLUMN IF EXISTS requests_per_minute,
DROP COLUMN IF EXISTS requests_per_day;
