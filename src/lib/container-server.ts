import "reflect-metadata";
import { container } from "tsyringe";

// This file contains Redis services and should ONLY be imported in server-side contexts
// It's independent of the client container to avoid circular dependencies

// Import mock services to avoid Redis circular dependencies
import { MockUsageTrackingService } from "@/services/rate-limiting/MockUsageTrackingService";

// Import core services that Redis-dependent services need
import { LoggingService } from "@/services/LoggingService";
import { SecParserService } from "@/services/parsing/SecParserService";
import { ApiKeyDataAccess } from "@/services/data-access/ApiKeyDataAccess";

// Import Redis-dependent route services
import { ParseRouteService } from "@/services/routes/ParseRouteService";
import { FilingsRouteService } from "@/services/routes/FilingsRouteService";
import { UsageStatsRouteService } from "@/services/routes/UsageStatsRouteService";

// Register core services that Redis-dependent services need
container.register("LoggingService", { useClass: LoggingService });
container.register("SecParserService", { useClass: SecParserService });
container.register("ApiKeyDataAccess", { useClass: ApiKeyDataAccess });

// Register mock services
container.register("UsageTrackingService", { useClass: MockUsageTrackingService });

// Register Redis-dependent route services
container.register("ParseRouteService", { useClass: ParseRouteService });
container.register("FilingsRouteService", { useClass: FilingsRouteService });
container.register("UsageStatsRouteService", { useClass: UsageStatsRouteService });

// Initialize Redis connection manager (disabled for now)
// container.resolve(RedisConnectionManager);

export { container };