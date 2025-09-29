CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"current_tier" varchar(50) DEFAULT 'free' NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "api_keys_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "api_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"endpoint" varchar(255) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"request_id" varchar(255) NOT NULL,
	"response_status" integer NOT NULL,
	"processing_time_ms" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_filings" (
	"id" serial PRIMARY KEY NOT NULL,
	"filing_id" varchar(255) NOT NULL,
	"parsed_successfully" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "processed_filings_filing_id_unique" UNIQUE("filing_id")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rate_limits_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"provider" varchar(50) DEFAULT 'google' NOT NULL,
	"provider_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
