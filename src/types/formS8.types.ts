import type { ConsistentDocumentFields, ParsedDocument } from "./filing-output";

/**
 * Form S-8 is used by public companies to register securities offered as part of 
 * employee benefit plans, such as stock options, profit-sharing, or bonuses. 
 * It allows companies to issue shares to employees and must be filed before 
 * issuing these securities.
 */
export interface FormS8Data extends ConsistentDocumentFields {
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
  registrationStatement: {
    titleOfSecurities: string;
    amountToBeRegistered: string;
    proposedMaximumOfferingPricePerShare: string;
    proposedMaximumAggregateOfferingPrice: string;
    amountOfRegistrationFee: string;
  };
  planInformation?: {
    planName: string;
    planDescription: string;
    participants: string;
    securitiesOffered: string;
  };
}

export type FormS8Filing = ParsedDocument<FormS8Data>;
