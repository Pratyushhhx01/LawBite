/**
 * Case-Law Research Engine Types
 * Provides strict TypeScript contracts for Indian court judgments,
 * advanced search filters, structured analysis, and Good-Law precedent verification.
 */

export type TreatmentType =
  | "Followed"
  | "Distinguished"
  | "Overruled"
  | "Partially Overruled"
  | "Reversed"
  | "Affirmed"
  | "Referred to"
  | "Clarified";

export interface ParagraphChunk {
  paraNumber: number;
  text: string;
}

export interface ImportantParagraph {
  paraNumber: number;
  quote: string;
  principle: string;
}

export interface RelatedJudgmentRef {
  title: string;
  citation?: string;
  relationship: "Followed" | "Referred to" | "Distinguished" | "Overruled" | "Cited with approval" | "Affirmed";
  notes?: string;
}

export interface JudgmentAnalysis {
  facts: string;
  legalIssues: string[];
  relevantProvisions: string[];
  argumentsAppellant: string;
  argumentsRespondent: string;
  courtReasoning: string;
  finalDecision: string;
  importantParagraphs: ImportantParagraph[];
  relatedJudgments: RelatedJudgmentRef[];
}

export interface SubsequentTreatment {
  citingCaseTitle: string;
  citingCaseCitation: string;
  citingCourt: string;
  citingDate: string;
  treatment: TreatmentType;
  paraRef: string; // e.g., "Para 119", "Para 168"
  notes: string;
  sourceUrl: string;
}

export type PrecedentStatusType =
  | "Good Law"
  | "Overruled"
  | "Partially Overruled"
  | "Distinguished"
  | "Clarified"
  | "Unverified";

export interface Judgment {
  id: string;
  title: string;
  court: string;
  caseNumber: string;
  date: string; // YYYY-MM-DD
  year: number;
  bench: string;
  benchSize: number;
  citations: string[];
  sourceUrl: string;
  caseType: string;
  actsInvolved: string[];
  sectionsInvolved: string[];
  summary: string;
  paragraphs: ParagraphChunk[];
  analysis: JudgmentAnalysis;
  precedentStatus: PrecedentStatusType;
  subsequentTreatments: SubsequentTreatment[];
}

export interface GoodLawCheckResult {
  caseId?: string;
  caseTitle: string;
  citation?: string;
  court?: string;
  status: "Good Law" | "Overruled" | "Partially Overruled" | "Distinguished" | "Clarified" | "Unverified";
  isGoodLaw: boolean | null; // true if good law, false if overruled/reversed, null if unverified
  confidence: "Authoritative" | "High" | "Unverified";
  rulingSummary: string;
  overrulingDetails?: {
    overruledByTitle: string;
    overruledByCitation: string;
    overruledByCourt: string;
    overruledDate: string;
    paraRef: string;
    overrulingGround: string;
    sourceUrl: string;
  };
  verifiedTreatments: SubsequentTreatment[];
  warning?: string;
}

export interface CaseSearchFilter {
  query?: string;
  court?: string;
  judge?: string;
  yearFrom?: number;
  yearTo?: number;
  caseType?: string;
  act?: string;
  section?: string;
  precedentStatus?: PrecedentStatusType;
  limit?: number;
  offset?: number;
}

export interface CaseSearchResultItem {
  id: string;
  title: string;
  court: string;
  caseNumber: string;
  date: string;
  year: number;
  bench: string;
  citations: string[];
  sourceUrl: string;
  caseType: string;
  actsInvolved: string[];
  sectionsInvolved: string[];
  summary: string;
  precedentStatus: PrecedentStatusType;
  relevantParagraphs?: ParagraphChunk[];
  matchScore?: number;
}

export interface CaseSearchResponse {
  total: number;
  results: CaseSearchResultItem[];
  page: number;
  limit: number;
}
