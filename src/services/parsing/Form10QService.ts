/**
 * Service for processing SEC Form 10-Q filings.
 *
 * Form 10-Q is a quarterly report that includes unaudited financial statements
 * and provides a continuing view of the company's financial position throughout
 * the year. These filings have high market impact as they provide quarterly
 * updates on company performance and are filed three times per year.
 */

import type { Form10QData } from "@/types/form10Q.types";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParsedDocument } from "@/types/filing-output";
import { inject, injectable } from "tsyringe";

/**
 * Service for processing SEC Form 10-Q filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class Form10QService {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<Form10QData>,
      Form10QData
    >,
  ) {}

  protected getFilingAgent(
    _parsedDoc: Form10QData,
    documentText: string,
  ): string {
    const companyNameMatch = documentText.match(
      /COMPANY CONFORMED NAME:\s+(.+)/,
    );
    return companyNameMatch ? companyNameMatch[1].trim() : "";
  }

  protected extractCusip(): string | null {
    return null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<Form10QData>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    return baseDoc;
  }

  protected extractTradingSymbol(
    _parsedDocument: Form10QData,
    documentText: string,
  ): string {
    // 10-Q filings typically include trading symbol in the header
    const symbolMatch = documentText.match(
      /TICKER SYMBOL:\s*([A-Z]{1,5})/i,
    );
    return symbolMatch ? symbolMatch[1].toUpperCase() : "";
  }

  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: Form10QData,
  ): ParsedDocument<Form10QData>["estimatedImpact"] {
    // Get base sentiment analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    
    // 10-Q filings have high market impact due to quarterly financial updates
    return {
      ...baseImpact,
      confidence: Math.min(baseImpact.confidence + 0.05, 1.0), // Slight confidence boost for quarterly reports
    };
  }
}
