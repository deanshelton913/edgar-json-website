/**
 * Service for processing SEC Form S-4 filings.
 *
 * Form S-4 is used for registering securities in business combination transactions,
 * such as mergers, acquisitions, and other significant corporate transactions.
 * These filings have extremely high market impact as they represent major
 * corporate restructuring events.
 */

import type { FormS4Data } from "@/types/formS4.types";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParsedDocument } from "@/types/filing-output";
import { inject, injectable } from "tsyringe";

/**
 * Service for processing SEC Form S-4 filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class FormS4Service {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<FormS4Data>,
      FormS4Data
    >,
  ) {}

  protected getFilingAgent(
    _parsedDoc: FormS4Data,
    documentText: string,
  ): string {
    const companyNameMatch = documentText.match(
      /COMPANY CONFORMED NAME:\s+(.+)/,
    );
    return companyNameMatch ? companyNameMatch[1].trim() : "";
  }

  protected extractCusip(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parsedDocument: FormS4Data,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string | null {
    return null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<FormS4Data>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    return baseDoc;
  }

  protected extractTradingSymbol(
    _parsedDocument: FormS4Data,
    documentText: string,
  ): string {
    // S-4 filings may include trading symbols for both companies involved
    const symbolMatch = documentText.match(
      /TICKER SYMBOL:\s*([A-Z]{1,5})/i,
    );
    return symbolMatch ? symbolMatch[1].toUpperCase() : "";
  }

  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: FormS4Data,
  ): ParsedDocument<FormS4Data>["estimatedImpact"] {
    // Get base impact analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    
    // S-4 filings have extremely high market impact due to M&A nature
    return {
      ...baseImpact,
      marketImpact: "positive", // M&A filings are generally positive
      confidence: Math.min(baseImpact.confidence + 0.15, 1.0), // Higher confidence boost for M&A filings
    };
  }
}
