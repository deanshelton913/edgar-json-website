import "reflect-metadata";
import { container } from "tsyringe";
import { LoggingService } from "@/services/LoggingService";
import { HttpService } from "@/services/HttpService";
import { RssService } from "@/services/RssService";
// Import data access services
import { UserDataAccess, ApiKeyDataAccess, UsageDataAccess, TosDataAccess, SubscriptionDataAccess } from "@/services/data-access";
import { UserComplianceService } from "@/services/UserComplianceService";
import { PlanConfigurationService } from "@/services/PlanConfigurationService";
import { ApiKeyService } from "@/services/ApiKeyService";
import { CredentialCachingService } from "@/services/CredentialCachingService";

// Import parsing services
import { SecParserService } from "@/services/parsing/SecParserService";
import { FormFactoryService } from "@/services/parsing/FormFactoryService";
import { GenericSecParsingService } from "@/services/parsing/GenericSecParsingService";
import { ParserService } from "@/services/parsing/ParserService";
import { UueCodecService } from "@/services/parsing/UueCodecService";
import { Form8KService } from "@/services/parsing/Form8KService";
import { Form4Service } from "@/services/parsing/Form4Service";
import { Form13FHrService } from "@/services/parsing/Form13FHrService";
import { FormS8Service } from "@/services/parsing/FormS8Service";
import { FormS1Service } from "@/services/parsing/FormS1Service";
import { Form10KService } from "@/services/parsing/Form10KService";
import { Form10QService } from "@/services/parsing/Form10QService";
import { FormS4Service } from "@/services/parsing/FormS4Service";
import { Schedule13DService } from "@/services/parsing/Schedule13DService";
import { Schedule13GService } from "@/services/parsing/Schedule13GService";
import { Form3Service } from "@/services/parsing/Form3Service";

// Import authorization services
import { ApiKeyAuthorizerService } from "@/services/authorizers/ApiKeyAuthorizerService";
import { CookieAuthorizerService } from "@/services/authorizers/CookieAuthorizerService";
import { GoogleAuthenticationService } from "@/services/authorizers/GoogleAuthenticationService";

// Import rate limiting services
import { RedisRateLimitService } from "@/services/rate-limiting/RedisRateLimitService";
import { UsageTrackingService } from "@/services/rate-limiting/UsageTrackingService";
import { ApiKeyCacheService } from "@/services/ApiKeyCacheService";

// Import stripe services
import { StripeService } from "@/services/stripe/StripeService";
import { WebhookService } from "@/services/stripe/WebhookService";

// Import route services
import { ParseRouteService } from "@/services/routes/ParseRouteService";
import { ApiKeyRouteService } from "@/services/routes/ApiKeyRouteService";
import { FilingsRouteService } from "@/services/routes/FilingsRouteService";
import { ApiKeyDeleteRouteService } from "@/services/routes/ApiKeyDeleteRouteService";
import { UsageStatsRouteService } from "@/services/routes/UsageStatsRouteService";
import { AuthUserRouteService } from "@/services/routes/AuthUserRouteService";
import { LogoutRouteService } from "@/services/routes/LogoutRouteService";
import { AuthCallbackRouteService } from "@/services/routes/AuthCallbackRouteService";
import { BillingInfoRouteService } from "@/services/routes/BillingInfoRouteService";
import { CancelSubscriptionRouteService } from "@/services/routes/CancelSubscriptionRouteService";
import { CreateCheckoutSessionRouteService } from "@/services/routes/CreateCheckoutSessionRouteService";
import { CreatePortalSessionRouteService } from "@/services/routes/CreatePortalSessionRouteService";
import { DowngradeCanceledRouteService } from "@/services/routes/DowngradeCanceledRouteService";
import { BillingSubscriptionRouteService } from "@/services/routes/BillingSubscriptionRouteService";
import { ReactivateSubscriptionRouteService } from "@/services/routes/ReactivateSubscriptionRouteService";

// Register core services
container.register("LoggingService", { useClass: LoggingService });
container.register("HttpService", { useClass: HttpService });
container.register("RssService", { useClass: RssService });
container.register("CredentialCachingService", { useClass: CredentialCachingService });

// Register data access services
container.register("UserDataAccess", { useClass: UserDataAccess });
container.register("ApiKeyDataAccess", { useClass: ApiKeyDataAccess });
container.register("UsageDataAccess", { useClass: UsageDataAccess });
container.register("TosDataAccess", { useClass: TosDataAccess });
container.register("SubscriptionDataAccess", { useClass: SubscriptionDataAccess });

// Register parsing services
container.register("SecParserService", { useClass: SecParserService });
container.register("FormFactoryService", { useClass: FormFactoryService });
container.register("GenericSecParsingService", { useClass: GenericSecParsingService });
container.register("ParserService", { useClass: ParserService });
container.register("UueCodecService", { useClass: UueCodecService });
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

// Register authorization services
container.register("ApiKeyAuthorizerService", { useClass: ApiKeyAuthorizerService });
container.register("CookieAuthorizerService", { useClass: CookieAuthorizerService });
container.register("GoogleAuthenticationService", { useClass: GoogleAuthenticationService });
container.register("UserComplianceService", { useClass: UserComplianceService });

// Register rate limiting services
container.register("RedisRateLimitService", { useClass: RedisRateLimitService });
container.register("UsageTrackingService", { useClass: UsageTrackingService });
container.register("ApiKeyCacheService", { useClass: ApiKeyCacheService });

// Register stripe services
container.register("StripeService", { useClass: StripeService });
container.register("WebhookService", { useClass: WebhookService });

// Register business services
container.register("PlanConfigurationService", { useClass: PlanConfigurationService });
container.register("ApiKeyService", { useClass: ApiKeyService });

// Register route services
container.register("ParseRouteService", { useClass: ParseRouteService });
container.register("ApiKeyRouteService", { useClass: ApiKeyRouteService });
container.register("FilingsRouteService", { useClass: FilingsRouteService });
container.register("ApiKeyDeleteRouteService", { useClass: ApiKeyDeleteRouteService });
container.register("UsageStatsRouteService", { useClass: UsageStatsRouteService });
container.register("AuthUserRouteService", { useClass: AuthUserRouteService });
container.register("LogoutRouteService", { useClass: LogoutRouteService });
container.register("AuthCallbackRouteService", { useClass: AuthCallbackRouteService });
container.register("BillingInfoRouteService", { useClass: BillingInfoRouteService });
container.register("CancelSubscriptionRouteService", { useClass: CancelSubscriptionRouteService });
container.register("CreateCheckoutSessionRouteService", { useClass: CreateCheckoutSessionRouteService });
container.register("CreatePortalSessionRouteService", { useClass: CreatePortalSessionRouteService });
container.register("DowngradeCanceledRouteService", { useClass: DowngradeCanceledRouteService });
container.register("BillingSubscriptionRouteService", { useClass: BillingSubscriptionRouteService });
container.register("ReactivateSubscriptionRouteService", { useClass: ReactivateSubscriptionRouteService });

export { container };