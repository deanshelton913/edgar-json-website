# Database Setup with Supabase and Drizzle

This project uses Supabase (PostgreSQL) with Drizzle ORM for data persistence.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and API keys

### 2. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Google OAuth Configuration
GOOGLE_CLIENT_ID=[YOUR-GOOGLE-CLIENT-ID]
GOOGLE_CLIENT_SECRET=[YOUR-GOOGLE-CLIENT-SECRET]

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[YOUR-NEXTAUTH-SECRET]
```

### 3. Database Migration

Run the following commands to set up your database:

```bash
# Generate migration files
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Database Studio (Optional)

To view and manage your database through a web interface:

```bash
npm run db:studio
```

## Database Schema

The following tables are created:

- `api_keys` - Stores user API keys and metadata
- `processed_filings` - Tracks filing processing status
- `api_usage` - Records API usage for billing and analytics
- `rate_limits` - Manages rate limiting counters
- `users` - User authentication and profile data

## Services

- `SupabaseService` - Main database service replacing DynamoDbService
- `UserApiKeyService` - Manages API key creation and validation
- `UsageTrackingService` - Tracks API usage and rate limits

## Migration from DynamoDB

The following services have been updated to use PostgreSQL:
- ✅ UserApiKeyService
- ✅ UsageTrackingService
- ✅ SupabaseService (new)

DynamoDB dependencies can be removed once Supabase is fully configured.

