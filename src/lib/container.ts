import "reflect-metadata";
import { container } from "tsyringe";
import { LoggingService } from "@/services/LoggingService";
import { HttpService } from "@/services/HttpService";
import { RssService } from "@/services/RssService";
import { SecParserService } from "@/services/SecParserService";
import { FormFactoryService } from "@/services/FormFactoryService";
import { GenericSecParsingService } from "@/services/GenericSecParsingService";
import { ParserService } from "@/services/ParserService";
import { UueCodecService } from "@/services/UueCodecService";
import { UsageTrackingService } from "@/services/UsageTrackingService";
import { UserDataAccess, ApiKeyDataAccess, UsageDataAccess, TosDataAccess, SubscriptionDataAccess } from "@/data-access";
import { ApiKeyAuthorizerService } from "@/services/ApiKeyAuthorizerService";
import { CookieAuthorizerService } from "@/services/CookieAuthorizerService";
import { AuthenticationService } from "@/services/AuthenticationService";
import { UserComplianceService } from "@/services/UserComplianceService";
import { RedisRateLimitService } from "@/services/RedisRateLimitService";
import { ApiKeyCacheService } from "@/services/ApiKeyCacheService";
import { StripeService } from "@/services/StripeService";
import { PlanConfigurationService } from "@/services/PlanConfigurationService";
import { ApiKeyService } from "@/services/ApiKeyService";

// Register all services
container.register("LoggingService", { useClass: LoggingService });
container.register("HttpService", { useClass: HttpService });
container.register("RssService", { useClass: RssService });
container.register("SecParserService", { useClass: SecParserService });
container.register("FormFactoryService", { useClass: FormFactoryService });
container.register("GenericSecParsingService", { useClass: GenericSecParsingService });
container.register("ParserService", { useClass: ParserService });
container.register("UueCodecService", { useClass: UueCodecService });
container.register("UsageTrackingService", { useClass: UsageTrackingService });

// Register data access services
container.register("UserDataAccess", { useClass: UserDataAccess });
container.register("ApiKeyDataAccess", { useClass: ApiKeyDataAccess });
container.register("UsageDataAccess", { useClass: UsageDataAccess });
container.register("TosDataAccess", { useClass: TosDataAccess });
container.register("SubscriptionDataAccess", { useClass: SubscriptionDataAccess });

// Register authorization services
container.register("ApiKeyAuthorizerService", { useClass: ApiKeyAuthorizerService });
container.register("CookieAuthorizerService", { useClass: CookieAuthorizerService });
container.register("AuthenticationService", { useClass: AuthenticationService });
container.register("UserComplianceService", { useClass: UserComplianceService });
container.register("RedisRateLimitService", { useClass: RedisRateLimitService });
container.register("ApiKeyCacheService", { useClass: ApiKeyCacheService });
container.register("StripeService", { useClass: StripeService });
container.register("PlanConfigurationService", { useClass: PlanConfigurationService });
container.register("ApiKeyService", { useClass: ApiKeyService });

// Register all form services
import { Form8KService } from "../services/Form8KService";
import { Form4Service } from "../services/Form4Service";
import { Form13FHrService } from "../services/Form13FHrService";
import { FormS8Service } from "../services/FormS8Service";
import { FormS1Service } from "../services/FormS1Service";
import { Form10KService } from "../services/Form10KService";
import { Form10QService } from "../services/Form10QService";
import { FormS4Service } from "../services/FormS4Service";
import { Schedule13DService } from "../services/Schedule13DService";
import { Schedule13GService } from "../services/Schedule13GService";
import { Form3Service } from "../services/Form3Service";

container.register("Form8KService", { useClass: Form8KService });
container.register("Form4Service", { useClass: Form4Service });
container.register("Form13FHrService", { useClass: Form13FHrService });
container.register("FormS8Service", { useClass: FormS8Service });
container.register("FormS1Service", { useClass: FormS1Service });
container.register("Form10KService", { useClass: Form10KService });
container.register("Form10QService", { useClass: Form10QService });
container.register("FormS4Service", { useClass: FormS4Service });
container.register("Schedule13DService", { useClass: Schedule13DService });
container.register("Schedule13GService", { useClass: Schedule13GService });
container.register("Form3Service", { useClass: Form3Service });

export { container };
