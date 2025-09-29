import { injectable, inject } from "tsyringe";
import { db, tosAgreements } from "@/db";
import { eq, desc } from "drizzle-orm";
import type { LoggingService } from "@/services/LoggingService";
import { createHash } from "crypto";

export interface TosAgreementRecord {
  id: number;
  cuid: string;
  userId: number; // Now references users.id
  tosHash: string;
  tosVersion: string;
  agreedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface CreateTosAgreementData {
  userId: number; // Now references users.id
  tosVersion: string;
  ipAddress?: string;
  userAgent?: string;
}

@injectable()
export class TosDataAccess {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  /**
   * Create a new TOS agreement record
   */
  async createTosAgreement(data: CreateTosAgreementData): Promise<TosAgreementRecord> {
    try {
      this.loggingService.debug(`[TOS_DATA] Creating TOS agreement for user: ${data.userId}`);

      // Generate hash of the TOS content using the single source of truth
      const tosContent = this.getTosContent(data.tosVersion);
      const tosHash = createHash('sha256').update(tosContent).digest('hex');

      const [agreement] = await db.insert(tosAgreements).values({
        userId: data.userId,
        tosHash: tosHash,
        tosVersion: data.tosVersion,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      }).returning();

      this.loggingService.debug(`[TOS_DATA] Created TOS agreement with ID: ${agreement.id}`);
      return agreement;

    } catch (error) {
      this.loggingService.error("[TOS_DATA] Error creating TOS agreement:", error);
      throw error;
    }
  }

  /**
   * Get the latest TOS agreement for a user
   */
  async getLatestTosAgreement(userId: number): Promise<TosAgreementRecord | null> {
    try {
      this.loggingService.debug(`[TOS_DATA] Getting latest TOS agreement for user: ${userId}`);

      const [agreement] = await db
        .select()
        .from(tosAgreements)
        .where(eq(tosAgreements.userId, userId))
        .orderBy(desc(tosAgreements.agreedAt))
        .limit(1);

      if (agreement) {
        this.loggingService.debug(`[TOS_DATA] Found TOS agreement for user: ${userId}, version: ${agreement.tosVersion}`);
      } else {
        this.loggingService.debug(`[TOS_DATA] No TOS agreement found for user: ${userId}`);
      }

      return agreement || null;

    } catch (error) {
      this.loggingService.error("[TOS_DATA] Error getting TOS agreement:", error);
      throw error;
    }
  }

  /**
   * Check if user has agreed to the current TOS version
   */
  async hasUserAgreedToTos(userId: number, tosVersion: string): Promise<boolean> {
    try {
      const agreement = await this.getLatestTosAgreement(userId);
      return agreement?.tosVersion === tosVersion;
    } catch (error) {
      this.loggingService.error("[TOS_DATA] Error checking TOS agreement:", error);
      return false;
    }
  }

  /**
   * Get all TOS agreements for a user (for audit purposes)
   */
  async getUserTosAgreements(userId: number): Promise<TosAgreementRecord[]> {
    try {
      this.loggingService.debug(`[TOS_DATA] Getting all TOS agreements for user: ${userId}`);

      const agreements = await db
        .select()
        .from(tosAgreements)
        .where(eq(tosAgreements.userId, userId))
        .orderBy(desc(tosAgreements.agreedAt));

      this.loggingService.debug(`[TOS_DATA] Found ${agreements.length} TOS agreements for user: ${userId}`);
      return agreements;

    } catch (error) {
      this.loggingService.error("[TOS_DATA] Error getting user TOS agreements:", error);
      throw error;
    }
  }

  /**
   * Get the current TOS version
   */
  getCurrentTosVersion(): string {
    return "1.0.0"; // This should be updated when TOS changes
  }

  /**
   * Get the TOS content for a specific version
   * This is the single source of truth for TOS content
   */
  getTosContent(version: string): string {
    // Single source of truth for TOS content
    const tosContent = `TERMS OF SERVICE - VERSION ${version}

EDGAR JSON API TERMS OF SERVICE

1. ACCEPTANCE OF TERMS
By accessing or using the EDGAR JSON API service, you agree to be bound by these Terms of Service.

2. SERVICE DESCRIPTION
The EDGAR JSON API provides access to SEC filing data converted to structured JSON format. The service is provided "AS IS" without any warranties or guarantees.

3. DATA ACCURACY DISCLAIMER
All data provided through this service is sourced from publicly available SEC filings. We make no representations or warranties regarding the accuracy, completeness, or timeliness of the data. Users acknowledge that:
- Data is provided "AS IS" without any guarantees
- Data may contain errors or omissions
- Users are responsible for verifying data accuracy
- We are not liable for any decisions made based on this data

4. LIMITATION OF LIABILITY
To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.

5. USER RESPONSIBILITIES
Users agree to:
- Use the service in compliance with all applicable laws
- Not attempt to reverse engineer or compromise the service
- Respect rate limits and usage guidelines
- Provide accurate information when registering

6. TERMINATION
We reserve the right to terminate or suspend access to the service at any time, with or without notice.

7. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.

8. CONTACT
For questions about these terms, please contact us through our support channels.

By agreeing to these terms, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.`;

    return tosContent;
  }
}
