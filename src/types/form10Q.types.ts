import type { ConsistentDocumentFields, ParsedDocument } from "./filing-output";

/**
 * Form 10-Q is a quarterly report that includes unaudited financial statements
 * and provides a continuing view of the company's financial position throughout
 * the year. It's filed three times per year (after Q1, Q2, and Q3).
 */
export interface Form10QData extends ConsistentDocumentFields {
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
  financialInformation: {
    condensedConsolidatedBalanceSheets: string;
    condensedConsolidatedStatementsOfOperations: string;
    condensedConsolidatedStatementsOfCashFlows: string;
    condensedConsolidatedStatementsOfStockholdersEquity: string;
    notesToCondensedConsolidatedFinancialStatements: string;
  };
  businessInformation: {
    managementDiscussionAndAnalysis: string;
    quantitativeAndQualitativeDisclosures: string;
    controlsAndProcedures: string;
  };
  marketInformation?: {
    marketForRegistrantCommonEquity: string;
    relatedStockholderMatters: string;
    issuerPurchasesOfEquitySecurities: string;
  };
  legalProceedings?: string;
  riskFactors?: string[];
}

export type Form10QFiling = ParsedDocument<Form10QData>;
