/**
 * Service for processing SEC Form 13F filings.
 *
 * Form 13F is used by institutional investment managers to report their holdings
 * of securities. This includes information about the securities they manage,
 * allowing investors to see the investment strategies and positions of these
 * managers. The form provides transparency and helps investors make informed
 * decisions based on the holdings of large institutional investors.
 */

import type { Form13FFiling } from "../types/form13f.types";
import type { ParsedDocument } from "../types/filing-output";
import { XMLParser } from "fast-xml-parser";

import { inject, injectable } from "tsyringe";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParserService } from "./ParserService";

/**
 * Service for processing SEC Form 13F filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class Form13FHrService {
  constructor(
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<Form13FFiling>,
      Form13FFiling
    >,
    @inject("ParserService")
    private parserService: ParserService,
  ) {}
  protected getFilingAgent(
    parsedDoc: Form13FFiling,
    _documentText: string,
  ): string {
    return parsedDoc.edgarSubmission.formData.coverPage.filingManager.name;
  }

  protected extractTradingSymbol(
    _parsedDocument: Form13FFiling,
    _documentText: string,
  ): string | null {
    return null;
  }

  protected extractCusip(
    parsedDocument: Form13FFiling,
    _documentText: string,
  ): string | null {
    return parsedDocument.infoTable.cusip;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<Form13FFiling>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    const xmlParser = new XMLParser({
      numberParseOptions: { leadingZeros: false, hex: false, eNotation: false },
    });

    // process the edgarSubmission from the form 13f-hr filing.
    let match = documentText.match(
      /<edgarSubmission.*?>([\s\S]*?)<\/edgarSubmission>/g,
    );
    if (match) {
      const xmlContent = match[0];
      const parsedXml = xmlParser.parse(xmlContent);
      baseDoc.parsed.edgarSubmission =
        this.parserService.normalizeKnownKeysAsAppropriateDataTypes(
          parsedXml.edgarSubmission,
        ) as unknown as Form13FFiling["edgarSubmission"];
    }

    // process the info table from the form 13f-hr filing.
    match = documentText.match(/<infoTable>([\s\S]*?)<\/infoTable>/g);
    if (match) {
      const xmlContent = match[0];
      const parsedXml = xmlParser.parse(xmlContent);
      baseDoc.parsed.infoTable =
        this.parserService.normalizeKnownKeysAsAppropriateDataTypes(
          parsedXml.infoTable,
        ) as unknown as Form13FFiling["infoTable"];
    }
    return baseDoc;
  }

  /**
   * Assess impact of the filing based on holdings and other relevant data
   * @param {string} rawDocumentText - Raw document text
   * @param {ParsedDocument<Form13FFiling>} parsedDoc  - Parsed document data
   * @returns Impact assessment of 13F filing with market impact, confidence, total score, and sentiment.
   *
   * The assessment process:
   * 1. Gets base impact analysis from parent class
   * 2. Analyzes the holdings reported in the filing
   * 3. Adjusts impact based on holdings size and voting authority
   *
   * @returns Impact assessment containing:
   *  - marketImpact: "positive", "negative", or "neutral"
   *  - confidence: Value between 0-1 indicating assessment confidence
   *  - totalScore: Score based on the analysis of holdings
   */
  protected assessImpact(
    rawDocumentText: string,
    parsedDoc: Form13FFiling,
  ): ParsedDocument<Form13FFiling>["estimatedImpact"] {
    // Get base impact analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    
    // Analyze the holdings and calculate the total value
    const totalValue = parsedDoc.infoTable.value;
    const sharesOrPrnAmt = parsedDoc.infoTable.shrsOrPrnAmt.sshPrnamt;

    // Determine market impact based on holdings size
    let marketImpact: "positive" | "negative" | "neutral" = "neutral";
    let confidence = baseImpact.confidence;

    // Large holdings are generally positive
    if (totalValue > 1000000 && sharesOrPrnAmt > 100000) {
      marketImpact = "positive";
      confidence = Math.min(confidence + 0.2, 1.0);
    } else if (totalValue < 100000) {
      marketImpact = "neutral";
      confidence = Math.max(confidence - 0.1, 0.1);
    }

    return {
      marketImpact,
      totalScore: Math.min(totalValue / 10000000, 1.0), // Normalize to 0-1 range
      confidence: Number.parseFloat(confidence.toFixed(8)),
      sentiment: 0.5, // Neutral placeholder
    };
  }
}
