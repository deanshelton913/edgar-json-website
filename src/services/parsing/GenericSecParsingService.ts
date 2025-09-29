// services/base-filing.service.ts
import type { ConsistentDocumentFields } from "@/types/filing-output";
import type { ParsedDocument } from "@/types/filing-output";


import { injectable, inject } from "tsyringe";
import type { ParserService } from "./ParserService";
import type { UueCodecService } from "./UueCodecService";
import type { LoggingService } from "@/services/LoggingService";

@injectable()
export class GenericSecParsingService<
  T extends ParsedDocument<A>,
  A extends ConsistentDocumentFields,
> {
  constructor(
    @inject("ParserService") private parserService: ParserService,
    @inject("UueCodecService") private uueCodecService: UueCodecService,
    @inject("LoggingService") private loggingService: LoggingService,
  ) {}

  public async parseDocumentAndFormatOutput(
    documentText: string,
    url: string,
  ): Promise<T> {
    const parsedDocument = (await this.parserService.parseRawSecFiling(
      documentText,
    )) as A;

    // Extract company information
    const companyName = this.extractCompanyName(documentText);
    const cik = this.extractCIK(documentText);
    const ticker = this.extractTradingSymbol(parsedDocument, documentText);
    
    // Add company info to parsed document
    if (companyName || cik || ticker) {
      (parsedDocument as A & { companyConformedName?: string; cik?: string; ticker?: string }).companyConformedName = companyName || undefined;
      (parsedDocument as A & { companyConformedName?: string; cik?: string; ticker?: string }).cik = cik || undefined;
      (parsedDocument as A & { companyConformedName?: string; cik?: string; ticker?: string }).ticker = ticker || undefined;
    }

    return {
      basic: {
        accessionNumber: this.getAccessionNumber(parsedDocument, documentText),
        acceptanceDatetime: this.getAcceptanceDatetime(
          parsedDocument,
          documentText,
        ),
        publicDocumentCount: this.getPublicDocumentCount(
          parsedDocument,
          documentText,
        ),
        filedAsOfDate: this.getFiledAsOfDate(parsedDocument, documentText),
        submissionType: this.getSubmissionType(parsedDocument, documentText), // the type of filing, e.g. 8-K, 13F, etc.
        url,
      },
      estimatedImpact: this.assessImpact(documentText, parsedDocument), // the estimated impact of the filing on the market
      parsed: parsedDocument,
      attachments: await this.getAttachments(parsedDocument, documentText, url),
    } as unknown as T;
  }

  protected async getAttachments(
    parsedDocument: A,
    documentText: string,
    url: string,
  ): Promise<string[]> {
    const publicDocumentCount = Number.parseInt(
      parsedDocument.publicDocumentCount,
    );
    if (publicDocumentCount === 0) {
      return [];
    }

    const attachments: string[] = [];

    // 1. Extract UUE-encoded files and store content in memory
    const uueFiles = this.uueCodecService.decodeUuEncodedFiles(documentText);
    const uueFilenames = new Set<string>();
    if (uueFiles.length > 0) {
      this.loggingService.debug(
        `[BASE_FILING_SERVICE] DECODING_UUE_ATTACHMENTS: ${url}`,
      );
      for (const file of uueFiles) {
        // Store the decoded content directly in memory instead of S3
        const content = new TextDecoder().decode(file.data);
        attachments.push(content);
        uueFilenames.add(file.name);
      }
      this.loggingService.debug(
        `[BASE_FILING_SERVICE] UUE_ATTACHMENTS_IN_MEMORY: ${uueFiles.map(f => f.name).join(",")}`,
      );
    }

    // 2. Extract XML attachments from <TEXT> sections (avoiding duplicates with UUE files)
    const xmlAttachments = await this.extractXmlAttachments(documentText, uueFilenames);
    attachments.push(...xmlAttachments);

    if (attachments.length > 0) {
      this.loggingService.debug(
        `[BASE_FILING_SERVICE] TOTAL_ATTACHMENTS: ${attachments.length} for ${url}`,
      );
    }

    return attachments;
  }

  /**
   * Extracts XML attachments from <DOCUMENT><TEXT> sections
   */
  private async extractXmlAttachments(
    documentText: string,
    uueFilenames: Set<string>,
  ): Promise<string[]> {
    const attachments: string[] = [];
    
    // More flexible regex to match DOCUMENT sections with optional TYPE/SEQUENCE tags
    const documentRegex = /<DOCUMENT>[\s\S]*?<FILENAME>([^<\n]+)[\s\S]*?<TEXT>([\s\S]*?)<\/TEXT>[\s\S]*?<\/DOCUMENT>/gi;
    
    let match;
    while ((match = documentRegex.exec(documentText)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      
      this.loggingService.debug(
        `[BASE_FILING_SERVICE] FOUND_DOCUMENT_SECTION: filename=${filename}, contentLength=${content.length}`,
      );
      
      // Skip files that are not relevant for text analysis
      const isImageFile = filename.match(/\.(jpg|jpeg|png|gif|bmp|tiff|webp|svg)$/i);
      const isBinaryFile = filename.match(/\.(pdf|zip|exe|dll|bin|dat|db|sqlite)$/i);
      const isTextFile = filename.match(/\.txt$/i);
      const isUueFile = uueFilenames.has(filename);
      
      if (filename && content && !isTextFile && !isUueFile && !isImageFile && !isBinaryFile) {
        // Skip .txt files as they're the main document
        // Skip files that are already extracted as UUE files
        // Skip image files as they're not relevant for text analysis
        // Skip binary files as they're not relevant for text analysis
        // Store content directly in memory instead of S3
        attachments.push(content);
        this.loggingService.debug(
          `[BASE_FILING_SERVICE] EXTRACTED_XML_ATTACHMENT: ${filename}`,
        );
      } else if (isImageFile) {
        this.loggingService.debug(
          `[BASE_FILING_SERVICE] SKIPPED_IMAGE_FILE: ${filename} (not relevant for text analysis)`,
        );
      } else if (isBinaryFile) {
        this.loggingService.debug(
          `[BASE_FILING_SERVICE] SKIPPED_BINARY_FILE: ${filename} (not relevant for text analysis)`,
        );
      }
    }
    
    return attachments;
  }

  /**
   * Extracts company name from document text
   */
  private extractCompanyName(documentText: string): string | null {
    // Try multiple patterns to find company name, prioritizing company fields over individual names
    const patterns = [
      /COMPANY CONFORMED NAME:\s*([^\n\r]+)/i,
      /ISSUER:\s*([^\n\r]+)/i,
      /COMPANY NAME:\s*([^\n\r]+)/i,
      // Look for issuer information in different formats
      /ISSUER NAME:\s*([^\n\r]+)/i,
      /ISSUER CONFORMED NAME:\s*([^\n\r]+)/i,
      // Look for company information in XML tags
      /<issuerName>([^<]+)<\/issuerName>/i,
      /<companyName>([^<]+)<\/companyName>/i,
      // Only use REPORTING PERSON as last resort, and only if it looks like a company name
      /REPORTING PERSON:\s*([^\n\r]+)/i,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = documentText.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Skip if it looks like a CIK or other non-name data
        if (!name.match(/^\d+$/) && name.length > 2) {
          // For REPORTING PERSON, check if it looks like a company name (not a person's name)
          if (pattern.source.includes('REPORTING PERSON')) {
            // Skip if it looks like a person's name (contains common person name patterns)
            if (this.looksLikePersonName(name)) {
              continue;
            }
          }
          this.loggingService.debug(
            `[GENERIC_PARSER] COMPANY_NAME_EXTRACTED: "${name}" using pattern ${i + 1}`,
          );
          return name;
        }
      }
    }

    this.loggingService.debug(
      `[GENERIC_PARSER] NO_COMPANY_NAME_FOUND: No valid company name found in document`,
    );
    return null;
  }

  /**
   * Checks if a name looks like a person's name rather than a company name
   */
  private looksLikePersonName(name: string): boolean {
    // Common patterns that indicate a person's name
    const personPatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/, // First Last
      /^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/, // First M. Last
      /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/, // First Middle Last
      /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/, // First Middle M. Last
    ];

    return personPatterns.some(pattern => pattern.test(name));
  }

  /**
   * Extracts CIK from document text
   */
  private extractCIK(documentText: string): string | null {
    // Try multiple patterns to find CIK
    const patterns = [
      /CENTRAL INDEX KEY:\s*(\d+)/i,
      /CIK:\s*(\d+)/i,
      /ISSUER CIK:\s*(\d+)/i,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = documentText.match(pattern);
      if (match && match[1]) {
        const cik = match[1].padStart(10, '0'); // Pad to 10 digits
        this.loggingService.debug(
          `[GENERIC_PARSER] CIK_EXTRACTED: "${cik}" using pattern ${i + 1}`,
        );
        return cik;
      }
    }

    this.loggingService.debug(
      `[GENERIC_PARSER] NO_CIK_FOUND: No valid CIK found in document`,
    );
    return null;
  }

  /**
   * Extracts company trading symbol from document text using regex patterns
   */
  protected extractTradingSymbol(
    _parsedDocument: A,
    documentText: string,
  ): string | null {
    // Look for ticker symbols in various formats
    const tickerPatterns = [
      // Standard formats with quotes
      /ticker symbol[:\s]*['"]([A-Z]{1,5})['"]/i,
      /symbol[:\s]*['"]([A-Z]{1,5})['"]/i,
      /trading symbol[:\s]*['"]([A-Z]{1,5})['"]/i,
      /under the symbol[:\s]*['"]([A-Z]{1,5})['"]/i,
      /ticker[:\s]*['"]([A-Z]{1,5})['"]/i,
      
      // Exchange formats without quotes (like "NYSE American: FAX")
      /NASDAQ[^:]*:\s*([A-Z]{1,5})\b/i,
      /NYSE[^:]*:\s*([A-Z]{1,5})\b/i,
      /NYSE American[^:]*:\s*([A-Z]{1,5})\b/i,
      /NYSE Arca[^:]*:\s*([A-Z]{1,5})\b/i,
      /NYSE MKT[^:]*:\s*([A-Z]{1,5})\b/i,
      /NASDAQ[^:]*symbol[:\s]*['"]([A-Z]{1,5})['"]/i,
      /NYSE[^:]*symbol[:\s]*['"]([A-Z]{1,5})['"]/i,
      
      // Parenthetical formats (like "(NYSE: FAX)")
      /\([^)]*NYSE[^)]*:\s*([A-Z]{1,5})\)/i,
      /\([^)]*NASDAQ[^)]*:\s*([A-Z]{1,5})\)/i,
      
      // Generic patterns
      /\(([A-Z]{1,5})\)/i, // Simple parenthetical ticker
      /\b([A-Z]{1,5})\b.*\([^)]*exchange[^)]*\)/i, // Ticker near exchange mention
    ];

    for (let i = 0; i < tickerPatterns.length; i++) {
      const pattern = tickerPatterns[i];
      const match = documentText.match(pattern);
      if (match && match[1]) {
        const ticker = match[1].trim();
        // Basic validation - should be 1-5 uppercase letters
        if (ticker.match(/^[A-Z]{1,5}$/)) {
          this.loggingService.debug(
            `[GENERIC_PARSER] TICKER_EXTRACTED: "${ticker}" using pattern ${i + 1}`,
          );
          return ticker;
        }
      }
    }

    this.loggingService.debug(
      `[GENERIC_PARSER] NO_TICKER_FOUND: No valid ticker symbol found in document`,
    );
    return null;
  }

  protected getAccessionNumber(parsedDoc: A, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string
  ): string {
    return parsedDoc.accessionNumber;
  }

  protected getAcceptanceDatetime(parsedDoc: A, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string
  ): number {
    return this.parseDatetime(parsedDoc.acceptanceDatetime);
  }

  protected getPublicDocumentCount(
    parsedDoc: A,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string,
  ): string {
    return parsedDoc.publicDocumentCount;
  }

  protected parseDatetime(input: number | string): number {
    // Convert the input to a string for consistent processing
    const datetimeStr = input.toString();

    let formattedDate: string;

    // Determine the format based on the input length
    if (datetimeStr.length === 14) {
      // Format for full datetime (YYYYMMDDHHMMSS)
      formattedDate = `${datetimeStr.slice(0, 4)}-${datetimeStr.slice(
        4,
        6,
      )}-${datetimeStr.slice(6, 8)}T${datetimeStr.slice(
        8,
        10,
      )}:${datetimeStr.slice(10, 12)}:${datetimeStr.slice(12, 14)}-04:00`;
    } else if (datetimeStr.length === 8) {
      // Format for date only (YYYYMMDD)
      formattedDate = `${datetimeStr.slice(0, 4)}-${datetimeStr.slice(
        4,
        6,
      )}-${datetimeStr.slice(6, 8)}T00:00:00-04:00`;
    } else {
      throw new Error(`Unexpected datetime format: ${datetimeStr}`);
    }

    // Convert to Unix timestamp and return (in seconds)
    return Math.floor(new Date(formattedDate).getTime() / 1000);
  }

  protected getFiledAsOfDate(parsedDoc: A, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string
  ): number {
    return this.parseDatetime(parsedDoc.filedAsOfDate);
  }

  protected getSubmissionType(parsedDoc: A, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _documentText: string
  ): string {
    return parsedDoc.conformedSubmissionType;
  }

  /**
   * Base implementation of impact assessment - simplified without sentiment analysis
   */
  public assessImpact(
    rawDocumentText: string,
    parsedDoc: A,
  ): ParsedDocument<A>["estimatedImpact"] {
    // Simple classification based on filing type and basic metrics
    const filingType = this.getSubmissionType(parsedDoc, rawDocumentText);
    
    // Basic impact classification based on filing type
    let marketImpact: "positive" | "negative" | "neutral" = "neutral";
    let confidence = 0.5;
    
    // Classify based on filing type importance
    if (["4", "4/A", "3"].includes(filingType)) {
      marketImpact = "positive"; // Insider trading filings are generally positive
      confidence = 0.7;
    } else if (["8-K", "S-1", "S-4"].includes(filingType)) {
      marketImpact = "positive"; // Major corporate events
      confidence = 0.6;
    } else if (["10-K", "10-Q"].includes(filingType)) {
      marketImpact = "neutral"; // Regular reporting
      confidence = 0.4;
    }

    return {
      marketImpact,
      confidence: Number.parseFloat(confidence.toFixed(8)),
      totalScore: Number.parseFloat(confidence.toFixed(8)),
      sentiment: 0.5, // Neutral sentiment as placeholder
    };
  }

}
