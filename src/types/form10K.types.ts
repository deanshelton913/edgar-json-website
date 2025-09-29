import type { ConsistentDocumentFields, ParsedDocument } from "./filing-output";

/**
 * Form 10-K is an annual report that provides a comprehensive overview of a company's 
 * financial performance, including audited financial statements, business operations,
 * risk factors, and management discussion and analysis (MD&A).
 */
export interface Form10KData extends ConsistentDocumentFields {
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
  businessInformation: {
    businessOverview: string;
    riskFactors: string[];
    properties: string;
    legalProceedings: string;
    mineSafetyDisclosures?: string;
  };
  financialInformation: {
    selectedFinancialData: string;
    supplementaryData: string;
    managementDiscussionAndAnalysis: string;
    quantitativeAndQualitativeDisclosures: string;
  };
  marketInformation?: {
    marketForRegistrantCommonEquity: string;
    relatedStockholderMatters: string;
    issuerPurchasesOfEquitySecurities: string;
  };
  corporateGovernance?: {
    directorsAndExecutiveOfficers: string;
    executiveCompensation: string;
    securityOwnershipOfCertainBeneficialOwners: string;
    certainRelationshipsAndRelatedTransactions: string;
    principalAccountantFeesAndServices: string;
  };
}

export type Form10KFiling = ParsedDocument<Form10KData>;
