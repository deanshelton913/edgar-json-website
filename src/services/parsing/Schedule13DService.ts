/**
 * Service for processing Schedule 13D filings.
 *
 * Schedule 13D is required when an individual or group acquires more than 5% of a 
 * company's voting shares. It provides details about the acquisition and the 
 * acquirer's intentions, which can significantly impact stock prices.
 * These filings have high market impact as they indicate potential activist
 * investors or takeover attempts.
 */

import type { Schedule13DData } from "@/types/schedule13D.types";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParsedDocument } from "@/types/filing-output";
import { inject, injectable } from "tsyringe";

/**
 * Service for processing Schedule 13D filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class Schedule13DService {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<Schedule13DData>,
      Schedule13DData
    >,
  ) {}

  protected getFilingAgent(
    _parsedDoc: Schedule13DData,
    documentText: string,
  ): string {
    const reportingPersonMatch = documentText.match(
      /REPORTING PERSON:\s+(.+)/i,
    );
    return reportingPersonMatch ? reportingPersonMatch[1].trim() : "";
  }

  protected extractCusip(
    _parsedDocument: Schedule13DData,
    documentText: string,
  ): string | null {
    const cusipMatch = documentText.match(
      /CUSIP:\s*([A-Z0-9]{9})/i,
    );
    return cusipMatch ? cusipMatch[1] : null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<Schedule13DData>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    return baseDoc;
  }

  protected extractTradingSymbol(
    _parsedDocument: Schedule13DData,
    documentText: string,
  ): string {
    // Schedule 13D filings typically include the issuer's trading symbol
    const symbolMatch = documentText.match(
      /TICKER SYMBOL:\s*([A-Z]{1,5})/i,
    );
    return symbolMatch ? symbolMatch[1].toUpperCase() : "";
  }

  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: Schedule13DData,
  ): ParsedDocument<Schedule13DData>["estimatedImpact"] {
    // Get base sentiment analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    
    // Schedule 13D filings have high market impact due to significant ownership changes
    return {
      ...baseImpact,
      marketImpact: baseImpact.marketImpact === "neutral" ? "positive" : baseImpact.marketImpact,
      confidence: Math.min(baseImpact.confidence + 0.1, 1.0), // Higher confidence boost for ownership filings
    };
  }
}
