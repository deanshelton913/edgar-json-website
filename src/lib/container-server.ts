import "reflect-metadata";
import { container } from "tsyringe";

// This file contains Redis services and should ONLY be imported in server-side contexts
// It's independent of the client container to avoid circular dependencies

// Import Redis-dependent services
import { UsageTrackingService } from "@/services/rate-limiting/UsageTrackingService";
import { RedisRateLimitService } from "@/services/rate-limiting/RedisRateLimitService";
import { RedisConnectionManager } from "@/services/RedisConnectionManager";
import { ApiKeyCacheService } from "@/services/ApiKeyCacheService";

// Import core services that Redis-dependent services need
import { LoggingService } from "@/services/LoggingService";
import { SecParserService } from "@/services/parsing/SecParserService";
import { ApiKeyDataAccess } from "@/services/data-access/ApiKeyDataAccess";
import { PlanConfigurationService } from "@/services/PlanConfigurationService";
import { SubscriptionDataAccess } from "@/services/data-access/SubscriptionDataAccess";

// Import Redis-dependent route services
import { ParseRouteService } from "@/services/routes/ParseRouteService";
import { FilingsRouteService } from "@/services/routes/FilingsRouteService";
import { UsageStatsRouteService } from "@/services/routes/UsageStatsRouteService";

// Register core services that Redis-dependent services need
container.register("LoggingService", { useClass: LoggingService });
container.register("SecParserService", { useClass: SecParserService });
container.register("ApiKeyDataAccess", { useClass: ApiKeyDataAccess });
container.register("PlanConfigurationService", { useClass: PlanConfigurationService });
container.register("SubscriptionDataAccess", { useClass: SubscriptionDataAccess });

// Register Redis services
container.register("ApiKeyCacheService", { useClass: ApiKeyCacheService });
container.register("RedisRateLimitService", { useClass: RedisRateLimitService });
container.register("UsageTrackingService", { useClass: UsageTrackingService });

// Initialize Redis connection manager
container.resolve(RedisConnectionManager);

// Register Redis-dependent route services
container.register("ParseRouteService", { useClass: ParseRouteService });
container.register("FilingsRouteService", { useClass: FilingsRouteService });
container.register("UsageStatsRouteService", { useClass: UsageStatsRouteService });

export { container };