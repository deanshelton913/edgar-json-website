/**
 * Service for processing SEC Form S-8 filings.
 *
 * Form S-8 is used by public companies to register securities offered as part of 
 * employee benefit plans, such as stock options, profit-sharing, or bonuses. 
 * It allows companies to issue shares to employees and must be filed before 
 * issuing these securities. The form provides details about the securities being
 * registered, the employee benefit plan, and the terms of the offering.
 */

import type { FormS8Data } from "@/types/formS8.types";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParsedDocument } from "@/types/filing-output";
import { inject, injectable } from "tsyringe";

/**
 * Service for processing SEC Form S-8 filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class FormS8Service {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<FormS8Data>,
      FormS8Data
    >,
  ) {}

  protected getFilingAgent(
    _parsedDoc: FormS8Data,
    documentText: string,
  ): string {
    const companyNameMatch = documentText.match(
      /COMPANY CONFORMED NAME:\s+(.+)/,
    );
    return companyNameMatch ? companyNameMatch[1].trim() : "";
  }

  protected extractCusip(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parsedDocument: FormS8Data,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string | null {
    return null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<FormS8Data>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    return baseDoc;
  }

  protected extractTradingSymbol(): string {
    // Form S-8 doesn't typically have trading symbols in the same way as Form 4
    // This would need to be extracted from the registration statement content
    return "";
  }

  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: FormS8Data,
  ): ParsedDocument<FormS8Data>["estimatedImpact"] {
    // Get base sentiment analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    return baseImpact;
  }
}
