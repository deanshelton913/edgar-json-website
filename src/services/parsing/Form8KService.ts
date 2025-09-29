/**
 * Service for processing SEC Form 8-K filings.
 *
 * Form 8-K is used to report major events that shareholders should know about.
 * This includes significant corporate events such as mergers, acquisitions,
 * changes in control, bankruptcy, and other important events that may affect
 * the company's financial condition or operations. The form provides timely
 * disclosure to ensure that investors have access to important information
 * that could impact their investment decisions.
 */

import { type Form8KData } from "@/types/form8k.types";
import type { ParsedDocument } from "@/types/filing-output";
import { inject, injectable } from "tsyringe";
import type { GenericSecParsingService } from "./GenericSecParsingService";
/**
 * Service for processing SEC Form 8-K filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class Form8KService {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<Form8KData>,
      Form8KData
    >,
  ) {}
  /**
   * Extracts company trading symbol from document text using regex patterns
   */
  protected extractTradingSymbol(
    _parsedDocument: Form8KData,
    documentText: string,
  ): string | null {
    const patterns = [/\(OTC:\s*([A-Z]+)\)/i];

    for (const pattern of patterns) {
      const match = documentText.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  protected getFilingAgent(
    parsedDoc: Form8KData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string {
    return parsedDoc.filer[0].companyData.companyConformedName;
  }

  protected extractCusip(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parsedDocument: Form8KData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string | null {
    return null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<Form8KData>> {
    const base =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    const estimatedImpact = this.assessImpact(documentText, base.parsed);
    return {
      ...base,
      estimatedImpact,
    };
  }

  /**
   * Assess impact of the filing based on item types
   * @param {string} rawDocumentText - Raw document text
   * @param {ParsedDocument<Form8KData>} parsedDoc  - Parsed document data
   * @returns Impact assessment of 8-K filing with market impact, confidence, total score, and sentiment.
   *
   * The assessment process:
   * 1. Gets base impact analysis from parent class
   * 2. Identifies specific 8-K item types (e.g. Item 1, 2) from the filing
   * 3. Adjusts impact based on item type importance
   *
   * @returns Impact assessment containing:
   *  - marketImpact: "positive", "negative", or "neutral"
   *  - confidence: Value between 0-1 indicating assessment confidence
   *  - totalScore: Impact score considering item types
   *  - sentiment: Neutral placeholder value
   */
  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: Form8KData,
  ): ParsedDocument<Form8KData>["estimatedImpact"] {
    // Get base impact analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );

    // Check for high-impact item types
    const highImpactItems = ["Item 1.01", "Item 2.01", "Item 3.01", "Item 5.01", "Item 8.01"];
    const hasHighImpactItems = parsedDoc.itemInformation.some(item => 
      highImpactItems.some(highImpact => item.includes(highImpact))
    );

    if (hasHighImpactItems) {
      return {
        ...baseImpact,
        marketImpact: "positive",
        confidence: Math.min(baseImpact.confidence + 0.2, 1.0),
        totalScore: Math.min(baseImpact.totalScore + 0.2, 1.0),
      };
    }

    return baseImpact;
  }
}
