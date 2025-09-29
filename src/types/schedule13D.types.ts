import type { ConsistentDocumentFields, ParsedDocument } from "./filing-output";

/**
 * Schedule 13D is required when an individual or group acquires more than 5% of a 
 * company's voting shares. It provides details about the acquisition and the 
 * acquirer's intentions, which can significantly impact stock prices.
 */
export interface Schedule13DData extends ConsistentDocumentFields {
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
  beneficialOwnership: {
    reportingPerson: {
      name: string;
      address: {
        street1: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
      };
      citizenship: string;
    };
    issuer: {
      name: string;
      address: {
        street1: string;
        street2?: string;
        city: string;
        state: string;
        zip: string;
      };
      cik: string;
    };
    securitiesOwned: {
      titleOfClass: string;
      cusip: string;
      amountBeneficiallyOwned: number;
      percentOfClass: number;
      soleVotingPower: number;
      sharedVotingPower: number;
      soleDispositivePower: number;
      sharedDispositivePower: number;
    };
  };
  transactionDetails?: Array<{
    dateOfTransaction: string;
    titleOfSecurity: string;
    amountOfSecurities: number;
    pricePerShare: number;
    natureOfTransaction: string;
  }>;
  purposeOfTransaction: {
    plansOrProposals: string[];
    additionalInformation: string;
  };
}

export type Schedule13DFiling = ParsedDocument<Schedule13DData>;
