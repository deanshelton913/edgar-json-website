import { injectable, inject } from "tsyringe";
import { TosDataAccess } from "@/services/data-access";
import { UserDataAccess } from "@/services/data-access";
import type { LoggingService } from "@/services/LoggingService";

export interface ComplianceRequirement {
  type: 'tos_agreement' | 'profile_update' | 'verification';
  message: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  requirements: ComplianceRequirement[];
  userId: string; // Keep as string for API compatibility
  userDbId?: number; // Add the actual DB ID
}

@injectable()
export class UserComplianceService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("TosDataAccess") private tosDataAccess: TosDataAccess,
    @inject("UserDataAccess") private userDataAccess: UserDataAccess,
  ) {}

  /**
   * Check if a user is compliant with all requirements
   */
  async checkUserCompliance(userId: string): Promise<ComplianceCheckResult> {
    try {
      this.loggingService.debug(`[COMPLIANCE] Checking compliance for user: ${userId}`);
      
      // Get user data using the numeric database ID
      const userData = await this.userDataAccess.getUserById(parseInt(userId));
      if (!userData) {
        this.loggingService.error(`[COMPLIANCE] User not found: ${userId}`);
        return {
          isCompliant: false,
          requirements: [{
            type: 'tos_agreement',
            message: 'User account not found. Please contact support.',
            priority: 'high'
          }],
          userId,
          userDbId: undefined
        };
      }

      const requirements: ComplianceRequirement[] = [];

      // Check TOS agreement using the database ID
      const currentTosVersion = this.tosDataAccess.getCurrentTosVersion();
      const hasAgreedToTos = await this.tosDataAccess.hasUserAgreedToTos(userData.id, currentTosVersion);
      
      if (!hasAgreedToTos) {
        requirements.push({
          type: 'tos_agreement',
          message: `You must agree to our Terms of Service (version ${currentTosVersion}) to continue using the service.`,
          actionUrl: '/tos-agreement',
          priority: 'high'
        });
      }

      // Future compliance checks can be added here:
      // - Email verification
      // - Profile completion
      // - Payment information
      // - Identity verification

      const isCompliant = requirements.length === 0;

      this.loggingService.debug(`[COMPLIANCE] User ${userId} compliance check: ${isCompliant ? 'compliant' : `${requirements.length} requirements pending`}`);

      return {
        isCompliant,
        requirements,
        userId,
        userDbId: userData.id
      };

    } catch (error) {
      this.loggingService.error(`[COMPLIANCE] Error checking user compliance:`, error);
      
      // Return non-compliant state on error to be safe
      return {
        isCompliant: false,
        requirements: [{
          type: 'tos_agreement',
          message: 'Unable to verify account compliance. Please try again.',
          priority: 'high'
        }],
        userId,
        userDbId: undefined
      };
    }
  }

  /**
   * Get the current TOS version for display
   */
  getCurrentTosVersion(): string {
    return this.tosDataAccess.getCurrentTosVersion();
  }

  /**
   * Get TOS content for display
   */
  getTosContent(version: string): string {
    return this.tosDataAccess.getTosContent(version);
  }
}
