import type { ConsistentDocumentFields, ParsedDocument } from "./filing-output";

/**
 * Form S-4 is used for registering securities in business combination transactions,
 * such as mergers, acquisitions, and other significant corporate transactions.
 * It contains detailed information about the transaction and its impact on shareholders.
 */
export interface FormS4Data extends ConsistentDocumentFields {
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
  transactionDetails: {
    transactionType: string; // e.g., "Merger", "Acquisition", "Tender Offer"
    titleOfSecurities: string;
    amountToBeRegistered: string;
    proposedMaximumOfferingPricePerShare: string;
    proposedMaximumAggregateOfferingPrice: string;
    amountOfRegistrationFee: string;
  };
  businessCombination: {
    summaryOfTransaction: string;
    backgroundOfTransaction: string;
    reasonsForTransaction: string;
    recommendationOfBoard: string;
    fairnessOpinion?: string;
  };
  financialInformation?: {
    selectedFinancialData: string;
    proFormaFinancialInformation: string;
    managementDiscussionAndAnalysis: string;
  };
  riskFactors?: string[];
  regulatoryApprovals?: string[];
}

export type FormS4Filing = ParsedDocument<FormS4Data>;
