import { injectable, inject } from "tsyringe";
import type { LoggingService } from "./LoggingService";
import type { FormFactoryService } from "./FormFactoryService";
import type { HttpService } from "./HttpService";
import type { EdgarFilingRssFeedItem, FilingTypes } from "./RssService";

@injectable()
export class SecParserService {
  constructor(
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("FormFactoryService") private formFactoryService: FormFactoryService,
    @inject("HttpService") private httpService: HttpService,
  ) {}

  /**
   * Parses a SEC filing using the existing FormFactoryService and HttpService
   */
  async parseSecFiling(filingPath: string): Promise<any> {
    try {
      // Extract filing information from the path
      // Format: 0000320193-24-000006.json
      const pathParts = filingPath.replace('.json', '').split('-');
      const cik = pathParts[0];
      const year = pathParts[1];
      const filingNumber = pathParts[2];

      // Construct SEC URL
      const secUrl = `https://www.sec.gov/Archives/edgar/data/${filingPath.replace('.json', '.txt')}`;
      
      this.loggingService.debug(`[SEC_PARSER] Processing filing: ${filingPath}`);

      // Create a mock EdgarFilingRssFeedItem for the FormFactoryService
      const mockFilingItem: EdgarFilingRssFeedItem = {
        title: `SEC Filing ${filingPath}`,
        link: secUrl.replace('.txt', '-index.htm'),
        summary: `SEC filing for CIK ${cik}`,
        updated: new Date().toISOString(),
        category: {
          $: {
            scheme: "http://www.sec.gov/edgar/securities/",
            label: "SEC Filing Type",
            term: this.detectFilingType(filingPath) // We'll detect this from the URL or content
          }
        },
        id: filingPath
      };

      this.loggingService.debug(`[SEC_PARSER] Detected filing type: ${mockFilingItem.category.$.term}`);

      // Get the appropriate parsing service
      const filingService = this.formFactoryService.getFilingService(mockFilingItem);

      // Fetch the raw filing content
      this.loggingService.debug(`[SEC_PARSER] Fetching filing content from: ${secUrl}`);
      const response = await this.httpService.get(secUrl, {
        headers: {
          "User-Agent": "Mukilteo Technical Solutions CORP. dean@mukilteotech.com",
          "Accept-Encoding": "gzip, deflate",
          Host: "www.sec.gov",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch filing: ${response.status} ${response.statusText}`);
      }

      const rawFilingContent = await response.text();
      this.loggingService.debug(`[SEC_PARSER] Fetched ${rawFilingContent.length} characters of filing content`);

      // Parse the filing using the appropriate service
      const parsedFiling = await filingService.parseDocumentAndFormatOutput(rawFilingContent, secUrl);

      this.loggingService.debug(`[SEC_PARSER] Successfully parsed filing`);

      return {
        parsedFiling,
        rawContentLength: rawFilingContent.length,
        filingType: mockFilingItem.category.$.term,
        cik,
        year,
        filingNumber,
        secUrl
      };

    } catch (error) {
      this.loggingService.error(`[SEC_PARSER] Error parsing filing: ${filingPath}`, error);
      throw error;
    }
  }

  /**
   * Detects the filing type from the filing path or URL
   * This is a simplified detection - in practice, you might want to fetch the filing first
   * to get the actual form type
   */
  private detectFilingType(_filingPath: string): FilingTypes {
    // For now, we'll use a generic parser for most filings
    // In practice, you might want to fetch the filing header first to detect the actual type
    return "10-K"; // Default to 10-K, but FormFactoryService will handle unknown types with GenericSecParsingService
  }
}
