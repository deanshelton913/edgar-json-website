import type { Form8KData } from "./form8k.types";
import type { Form4Data } from "./form4.types";
import type { Form13FFiling } from "./form13f.types";
import type { FormS8Data } from "./formS8.types";
import type { FormS1Data } from "./formS1.types";
import type { Form10KData } from "./form10K.types";
import type { Form10QData } from "./form10Q.types";
import type { FormS4Data } from "./formS4.types";
import type { Schedule13DData } from "./schedule13D.types";
import type { Form3Data } from "./form3.types";

export type ParsedDocumentTypes =
  | Form8KData
  | Form4Data
  | Form13FFiling
  | FormS8Data
  | FormS1Data
  | Form10KData
  | Form10QData
  | FormS4Data
  | Schedule13DData
  | Form3Data
  | ConsistentDocumentFields;

export interface ParsedDocument<T extends ConsistentDocumentFields> {
  // Common SEC filing header fields
  basic: {
    accessionNumber: string;
    acceptanceDatetime: number;
    conformedSubmissionType: string;
    publicDocumentCount: string;
    filedAsOfDate: number;
    dateAsOfChange: string;
    unixTimestamp: number;
    submissionType: string;
    url: string;
  };
  estimatedImpact: {
    marketImpact: "positive" | "negative" | "neutral";
    confidence: number;
    totalScore: number;
    sentiment: number;
  };
  parsed: T;
  attachments?: string[];
}

export interface ConsistentDocumentFields {
  accessionNumber: string;
  acceptanceDatetime: string;
  conformedSubmissionType: string;
  publicDocumentCount: string;
  filedAsOfDate: string;
  unixTimestamp: number;
}
