/**
 * Service for processing SEC Form 10-K filings.
 *
 * Form 10-K is an annual report that provides a comprehensive overview of a company's 
 * financial performance, including audited financial statements, business operations,
 * risk factors, and management discussion and analysis (MD&A). These filings have
 * high market impact as they provide the most complete picture of a company's health.
 */

import type { Form10KData } from "@/types/form10K.types";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParsedDocument } from "@/types/filing-output";
import { inject, injectable } from "tsyringe";

/**
 * Service for processing SEC Form 10-K filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class Form10KService {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<Form10KData>,
      Form10KData
    >,
  ) {}

  protected getFilingAgent(
    _parsedDoc: Form10KData,
    documentText: string,
  ): string {
    const companyNameMatch = documentText.match(
      /COMPANY CONFORMED NAME:\s+(.+)/,
    );
    return companyNameMatch ? companyNameMatch[1].trim() : "";
  }

  protected extractCusip(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parsedDocument: Form10KData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string | null {
    return null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<Form10KData>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    return baseDoc;
  }

  protected extractTradingSymbol(
    _parsedDocument: Form10KData,
    documentText: string,
  ): string {
    // 10-K filings typically include trading symbol in the header
    const symbolMatch = documentText.match(
      /TICKER SYMBOL:\s*([A-Z]{1,5})/i,
    );
    return symbolMatch ? symbolMatch[1].toUpperCase() : "";
  }

  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: Form10KData,
  ): ParsedDocument<Form10KData>["estimatedImpact"] {
    // Get base sentiment analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    
    // 10-K filings have high market impact due to comprehensive financial disclosure
    return {
      ...baseImpact,
      confidence: Math.min(baseImpact.confidence + 0.05, 1.0), // Slight confidence boost for annual reports
    };
  }
}
