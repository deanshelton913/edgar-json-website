-- Add rate limit columns to api_keys table
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS requests_per_minute INTEGER DEFAULT 10 NOT NULL,
ADD COLUMN IF NOT EXISTS requests_per_day INTEGER DEFAULT 100 NOT NULL;
