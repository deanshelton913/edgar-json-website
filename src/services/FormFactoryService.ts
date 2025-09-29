import type { Form13FHrService } from "./Form13FHrService";
import type { Form4Service } from "./Form4Service";
import type { Form8KService } from "./Form8KService";
import type { FormS8Service } from "./FormS8Service";
import type { FormS1Service } from "./FormS1Service";
import type { Form10KService } from "./Form10KService";
import type { Form10QService } from "./Form10QService";
import type { FormS4Service } from "./FormS4Service";
import type { Schedule13DService } from "./Schedule13DService";
import type { Schedule13GService } from "./Schedule13GService";
import type { Form3Service } from "./Form3Service";
import { inject, injectable } from "tsyringe";
import type { EdgarFilingRssFeedItem } from "./RssService";
import type { GenericSecParsingService } from "./GenericSecParsingService";
import type { LoggingService } from "./LoggingService";
import type {
  ConsistentDocumentFields,
  ParsedDocument,
} from "../types/filing-output";

type ParsedDocumentService =
  | Form8KService
  | Form4Service
  | Form13FHrService
  | FormS8Service
  | FormS1Service
  | Form10KService
  | Form10QService
  | FormS4Service
  | Schedule13DService
  | Schedule13GService
  | Form3Service
  | GenericSecParsingService<
      ParsedDocument<ConsistentDocumentFields>,
      ConsistentDocumentFields
    >;
@injectable()
export class FormFactoryService {
  constructor(
    @inject("Form8KService") private form8KService: Form8KService,
    @inject("Form4Service") private form4Service: Form4Service,
    @inject("Form13FHrService") private form13FHrService: Form13FHrService,
    @inject("FormS8Service") private formS8Service: FormS8Service,
    @inject("FormS1Service") private formS1Service: FormS1Service,
    @inject("Form10KService") private form10KService: Form10KService,
    @inject("Form10QService") private form10QService: Form10QService,
    @inject("FormS4Service") private formS4Service: FormS4Service,
    @inject("Schedule13DService")
    private schedule13DService: Schedule13DService,
    @inject("Schedule13GService")
    private schedule13GService: Schedule13GService,
    @inject("Form3Service") private form3Service: Form3Service,
    @inject("LoggingService") private loggingService: LoggingService,
    @inject("GenericSecParsingService")
    private genericSecParsingService: GenericSecParsingService<
      ParsedDocument<ConsistentDocumentFields>,
      ConsistentDocumentFields
    >,
  ) {}

  public getFilingService(
    filing: EdgarFilingRssFeedItem,
  ): ParsedDocumentService {
    let filingService: ParsedDocumentService;
    switch (filing.category.$.term) {
      case "8-K": {
        filingService = this.form8KService;
        break;
      }
      case "4": {
        filingService = this.form4Service;
        break;
      }
      case "4/A": {
        filingService = this.form4Service;
        break;
      }
      case "13F-HR": {
        filingService = this.form13FHrService;
        break;
      }
      case "S-8": {
        filingService = this.formS8Service;
        break;
      }
      case "S-1": {
        filingService = this.formS1Service;
        break;
      }
      case "10-K": {
        filingService = this.form10KService;
        break;
      }
      case "10-Q": {
        filingService = this.form10QService;
        break;
      }
      case "S-4": {
        filingService = this.formS4Service;
        break;
      }
      case "13D": {
        filingService = this.schedule13DService;
        break;
      }
      case "13D/A": {
        filingService = this.schedule13DService;
        break;
      }
      case "3": {
        filingService = this.form3Service;
        break;
      }
      case "13G": {
        filingService = this.schedule13GService;
        break;
      }
      case "13G/A": {
        filingService = this.schedule13GService;
        break;
      }
      case "S-1/A": {
        filingService = this.formS1Service;
        break;
      }
      case "144": {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
        break;
      }
      case "144/A": {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
        break;
      }
      case "N-23C3A": {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
        break;
      }
      case "SC TO-I": {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
        break;
      }
      case "D": {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
        break;
      }
      case "497": {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
        break;
      }
      case "424B2": {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
        break;
      }
      default: {
        filingService = this.genericSecParsingService;
        this.loggingService.debug(
          `[FORM_FACTORY] USING_GENERIC_PARSING_SERVICE: ${filing.category.$.term}: ${filing.link} `,
        );
      }
    }
    return filingService;
  }
}
