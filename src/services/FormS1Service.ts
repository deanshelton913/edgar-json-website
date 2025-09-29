/**
 * Service for processing SEC Form S-1 filings.
 *
 * Form S-1 is the initial registration statement for new securities offerings by public companies.
 * It's commonly used for initial public offerings (IPOs) and contains comprehensive information
 * about the company, its business, financial condition, and the securities being offered.
 * These filings have extremely high market impact as they represent new public companies.
 */

import type { FormS1Data } from "../types/formS1.types";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParsedDocument } from "../types/filing-output";
import { inject, injectable } from "tsyringe";

/**
 * Service for processing SEC Form S-1 filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class FormS1Service {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<FormS1Data>,
      FormS1Data
    >,
  ) {}

  protected getFilingAgent(
    _parsedDoc: FormS1Data,
    documentText: string,
  ): string {
    const companyNameMatch = documentText.match(
      /COMPANY CONFORMED NAME:\s+(.+)/,
    );
    return companyNameMatch ? companyNameMatch[1].trim() : "";
  }

  protected extractCusip(
    _parsedDocument: FormS1Data,
    _documentText: string,
  ): string | null {
    return null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<FormS1Data>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    return baseDoc;
  }

  protected extractTradingSymbol(
    _parsedDocument: FormS1Data,
    documentText: string,
  ): string {
    // For IPOs, trading symbol might be in the offering details
    const symbolMatch = documentText.match(
      /TICKER SYMBOL:\s*([A-Z]{1,5})/i,
    );
    return symbolMatch ? symbolMatch[1].toUpperCase() : "";
  }

  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: FormS1Data,
  ): ParsedDocument<FormS1Data>["estimatedImpact"] {
    // Get base sentiment analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    
    // S-1 filings typically have high market impact due to IPO nature
    return {
      ...baseImpact,
      marketImpact: baseImpact.marketImpact === "neutral" ? "positive" : baseImpact.marketImpact,
      confidence: Math.min(baseImpact.confidence + 0.1, 1.0), // Boost confidence for IPO filings
    };
  }
}
