/**
 * Service for processing SEC Form 3 filings.
 *
 * Form 3 is the "Initial Statement of Beneficial Ownership of Securities" filed when
 * someone becomes a corporate insider (director, officer, or beneficial owner of 10%+
 * of company securities). This establishes their initial ownership position and is
 * the first filing an insider makes. These filings have high market impact as they
 * signal new insider appointments and strategic changes.
 */

import type { Form3Data } from "@/types/form3.types";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { ParsedDocument } from "@/types/filing-output";
import { XMLParser } from "fast-xml-parser";
import { inject, injectable } from "tsyringe";
import type { ParserService } from "./ParserService";

/**
 * Service for processing SEC Form 3 filings.
 * Analyzes filing content to determine market impact and sentiment.
 */
@injectable()
export class Form3Service {
  constructor(
    @inject("ParserService") private parserService: ParserService,
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<Form3Data>,
      Form3Data
    >,
  ) {}

  protected getFilingAgent(
    _parsedDoc: Form3Data,
    documentText: string,
  ): string {
    const reportingPersonMatch = documentText.match(
      /REPORTING PERSON:\s+(.+)/i,
    );
    return reportingPersonMatch ? reportingPersonMatch[1].trim() : "";
  }

  protected extractCusip(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _parsedDocument: Form3Data,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string | null {
    return null;
  }

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<ParsedDocument<Form3Data>> {
    const baseDoc =
      await this.genericSecParsingService.parseDocumentAndFormatOutput(
        documentText,
        url,
      );
    
    // Parse the ownership document if present
    const ownershipDocumentMatch = documentText.match(
      /<ownershipDocument>([\s\S]*?)<\/ownershipDocument>/g,
    );
    
    if (ownershipDocumentMatch) {
      const xmlParser = new XMLParser({
        numberParseOptions: { leadingZeros: false, hex: false, eNotation: false },
      });
      
      for (const xmlContent of ownershipDocumentMatch) {
        try {
          const parsedXml = xmlParser.parse(xmlContent);
          if (parsedXml.ownershipDocument) {
            baseDoc.parsed.beneficialOwnership = {
              ownershipDocument: this.parserService.normalizeKnownKeysAsAppropriateDataTypes(
                parsedXml.ownershipDocument,
              ) as unknown as NonNullable<Form3Data["beneficialOwnership"]>["ownershipDocument"],
            };
            break; // Use the first ownership document found
          }
        } catch (error) {
          // Continue if XML parsing fails
          console.warn("Failed to parse ownership document XML:", error);
        }
      }
    }

    // Parse reporting person and issuer data from the main document
    this.parseReportingPersonAndIssuer(documentText, baseDoc.parsed);

    return baseDoc;
  }

  private parseReportingPersonAndIssuer(
    documentText: string,
    parsedDoc: Form3Data,
  ): void {
    // Parse reporting person data
    const reportingPersonMatch = documentText.match(
      /REPORTING PERSON:\s*([^<]+)/i,
    );
    if (reportingPersonMatch) {
      parsedDoc.reportingPerson = {
        ownerData: {
          companyConformedName: reportingPersonMatch[1].trim(),
          centralIndexKey: this.extractCik(documentText, "REPORTING PERSON"),
        },
        filingValues: {
          formType: "3",
          secAct: "1934 Act",
          secFileNumber: this.extractFileNumber(documentText),
          filmNumber: this.extractFilmNumber(documentText),
        },
        mailAddress: this.extractMailingAddress(documentText, "REPORTING PERSON"),
      };
    }

    // Parse issuer data
    const issuerMatch = documentText.match(
      /ISSUER:\s*([^<]+)/i,
    );
    if (issuerMatch) {
      parsedDoc.issuer = {
        companyData: {
          companyConformedName: issuerMatch[1].trim(),
          centralIndexKey: this.extractCik(documentText, "ISSUER"),
          standardIndustrialClassification: this.extractSic(documentText),
          ein: this.extractEin(documentText),
          stateOfIncorporation: this.extractStateOfIncorporation(documentText),
          fiscalYearEnd: this.extractFiscalYearEnd(documentText),
        },
        businessAddress: this.extractBusinessAddress(documentText, "ISSUER"),
        mailAddress: this.extractMailingAddress(documentText, "ISSUER"),
        formerCompany: this.extractFormerCompanies(documentText),
      };
    }
  }

  private extractCik(documentText: string, entityType: string): string {
    const cikMatch = documentText.match(
      new RegExp(`${entityType}[\\s\\S]*?CIK[\\s\\S]*?(\\d{10})`, "i"),
    );
    return cikMatch ? cikMatch[1] : "";
  }

  private extractFileNumber(documentText: string): string {
    const fileNumberMatch = documentText.match(
      /FILE NO[\s\S]*?(\d{3}-\d{6})/i,
    );
    return fileNumberMatch ? fileNumberMatch[1] : "";
  }

  private extractFilmNumber(documentText: string): string {
    const filmNumberMatch = documentText.match(
      /FILM NO[\s\S]*?(\d{8})/i,
    );
    return filmNumberMatch ? filmNumberMatch[1] : "";
  }

  private extractSic(documentText: string): string {
    const sicMatch = documentText.match(
      /SIC[\s\S]*?(\d{4}[\s\S]*?[A-Z][^\n]*)/i,
    );
    return sicMatch ? sicMatch[1].trim() : "";
  }

  private extractEin(documentText: string): string {
    const einMatch = documentText.match(
      /EIN[\s\S]*?(\d{2}-\d{7})/i,
    );
    return einMatch ? einMatch[1] : "";
  }

  private extractStateOfIncorporation(documentText: string): string {
    const stateMatch = documentText.match(
      /STATE OF INCORP[\s\S]*?([A-Z]{2})/i,
    );
    return stateMatch ? stateMatch[1] : "";
  }

  private extractFiscalYearEnd(documentText: string): string {
    const fiscalYearMatch = documentText.match(
      /FISCAL YEAR END[\s\S]*?(\d{4})/i,
    );
    return fiscalYearMatch ? fiscalYearMatch[1] : "";
  }

  private extractMailingAddress(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _entityType: string,
  ): Form3Data["reportingPerson"]["mailAddress"] | undefined {
    // This is a simplified extraction - would need more robust parsing
    return undefined;
  }

  private extractBusinessAddress(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _entityType: string,
  ): Form3Data["issuer"]["businessAddress"] | undefined {
    // This is a simplified extraction - would need more robust parsing
    return undefined;
  }

  private extractFormerCompanies(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): Form3Data["issuer"]["formerCompany"] | undefined {
    // This is a simplified extraction - would need more robust parsing
    return undefined;
  }

  public extractTradingSymbol(
    parsedDocument: Form3Data,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string {
    // Form 3 may not have trading symbols in the same way as other forms
    return parsedDocument.beneficialOwnership?.ownershipDocument?.issuer?.issuerTradingSymbol || "";
  }

  public assessImpact(
    rawDocumentText: string,
    parsedDoc: Form3Data,
  ): ParsedDocument<Form3Data>["estimatedImpact"] {
    // Get base sentiment analysis from parent class
    const baseImpact = this.genericSecParsingService.assessImpact(
      rawDocumentText,
      parsedDoc,
    );
    
    // Form 3 filings have high market impact due to new insider appointments
    return {
      ...baseImpact,
      marketImpact: baseImpact.marketImpact === "neutral" ? "positive" : baseImpact.marketImpact,
      confidence: Math.min(baseImpact.confidence + 0.1, 1.0), // Higher confidence boost for insider appointments
    };
  }
}
