import type { ConsistentDocumentFields, ParsedDocument } from "./filing-output";

/**
 * Form S-1 is the initial registration statement for new securities offerings by public companies.
 * It's commonly used for initial public offerings (IPOs) and contains comprehensive information
 * about the company, its business, financial condition, and the securities being offered.
 */
export interface FormS1Data extends ConsistentDocumentFields {
  filer: Array<{
    companyData: {
      companyConformedName: string;
      centralIndexKey: string;
      standardIndustrialClassification: string;
      organizationName?: string;
      irsNumber: string;
      stateOfIncorporation: string;
      fiscalYearEnd: string;
    };
    filingValues: {
      formType: string;
      secAct: string;
      secFileNumber: string;
      filmNumber: string;
    };
    businessAddress?: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      businessPhone: string;
    };
    mailAddress?: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
    };
  }>;
  offeringDetails: {
    titleOfSecurities: string;
    amountToBeRegistered: string;
    proposedMaximumOfferingPricePerShare: string;
    proposedMaximumAggregateOfferingPrice: string;
    amountOfRegistrationFee: string;
  };
  businessDescription?: {
    businessOverview: string;
    riskFactors: string[];
    useOfProceeds: string;
    dividendPolicy: string;
  };
  financialInformation?: {
    selectedFinancialData: string;
    managementDiscussion: string;
    quantitativeAndQualitativeDisclosures: string;
  };
}

export type FormS1Filing = ParsedDocument<FormS1Data>;
