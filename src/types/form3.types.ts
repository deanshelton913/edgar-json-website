import type { ConsistentDocumentFields, ParsedDocument } from "./filing-output";

/**
 * Form 3 is the "Initial Statement of Beneficial Ownership of Securities" filed when
 * someone becomes a corporate insider (director, officer, or beneficial owner of 10%+
 * of company securities). This establishes their initial ownership position and is
 * the first filing an insider makes.
 */
export interface Form3Data extends ConsistentDocumentFields {
  reportingPerson: {
    ownerData: {
      companyConformedName: string;
      centralIndexKey: string;
      organizationName?: string;
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
      businessPhone?: string;
    };
    mailAddress?: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  issuer: {
    companyData: {
      companyConformedName: string;
      centralIndexKey: string;
      standardIndustrialClassification: string;
      organizationName?: string;
      ein?: string;
      stateOfIncorporation: string;
      fiscalYearEnd: string;
    };
    businessAddress?: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
      businessPhone?: string;
    };
    mailAddress?: {
      street1: string;
      street2?: string;
      city: string;
      state: string;
      zip: string;
    };
    formerCompany?: Array<{
      formerConformedName: string;
      dateOfNameChange: string;
    }>;
  };
  beneficialOwnership?: {
    ownershipDocument: {
      issuer: {
        issuerCik: string;
        issuerName: string;
        issuerTradingSymbol?: string;
      };
      reportingOwner: {
        reportingOwnerId: {
          rptOwnerCik: string;
          rptOwnerName: string;
        };
        reportingOwnerAddress: {
          rptOwnerStreet1: string;
          rptOwnerStreet2?: string;
          rptOwnerCity: string;
          rptOwnerState: string;
          rptOwnerZipCode: string;
        };
        reportingOwnerRelationship: {
          isDirector: boolean;
          isOfficer: boolean;
          isTenPercentOwner: boolean;
          isOther: boolean;
          officerTitle?: string;
          otherText?: string;
        };
      };
      nonDerivativeTable?: {
        nonDerivativeTransaction: Array<{
          securityTitle: string;
          transactionDate: string;
          transactionCode: string;
          transactionShares: number;
          transactionPricePerShare: number;
          sharesOwnedFollowingTransaction: number;
          directOrIndirectOwnership: string;
        }>;
      };
      derivativeTable?: {
        derivativeTransaction: Array<{
          securityTitle: string;
          conversionOrExercisePrice: number;
          transactionDate: string;
          transactionCode: string;
          transactionShares: number;
          transactionPricePerShare: number;
          exerciseDate: string;
          expirationDate: string;
          underlyingSecurityTitle: string;
          underlyingSecurityShares: number;
        }>;
      };
    };
  };
}

export type Form3Filing = ParsedDocument<Form3Data>;
