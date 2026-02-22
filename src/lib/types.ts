export type BeverageType = "spirits" | "wine" | "beer";

export interface ApplicationData {
  beverageType: BeverageType;
  brandName: string;
  classTypeDesignation: string;
  alcoholContent: string;
  netContents: string;
  producerName: string;
  producerAddress: string;
  countryOfOrigin?: string;
  appellation?: string;
  vintageYear?: string;
}

export interface GovernmentWarningExtraction {
  present: boolean;
  fullText: string | null;
  governmentWarningInCaps: boolean;
  governmentWarningAppearsBold: boolean;
  bodyTextAppearsBold: boolean;
  separateFromOtherText: boolean;
}

export interface ExtractedLabelData {
  brandName: string | null;
  classTypeDesignation: string | null;
  alcoholContent: string | null;
  netContents: string | null;
  producerName: string | null;
  producerAddress: string | null;
  countryOfOrigin: string | null;
  appellation: string | null;
  vintageYear: string | null;
  governmentWarning: GovernmentWarningExtraction;
  sulfitesDeclaration: string | null;
  additionalText: string[];
  confidence: "high" | "medium" | "low";
  rawNotes: string;
}

export type MatchStatus =
  | "match"
  | "mismatch"
  | "partial_match"
  | "missing"
  | "not_required";

export interface FieldComparison {
  fieldName: string;
  displayName: string;
  expected: string | null;
  extracted: string | null;
  status: MatchStatus;
  similarityScore: number;
  notes: string;
}

export interface GovernmentWarningResult {
  present: boolean;
  textCorrect: boolean;
  formattingCorrect: boolean;
  issues: string[];
}

export interface VerificationResult {
  id: string;
  timestamp: string;
  imageFileName: string;
  beverageType: BeverageType;
  overallStatus: "approved" | "needs_review" | "rejected";
  fieldComparisons: FieldComparison[];
  governmentWarningResult: GovernmentWarningResult;
  extractedData: ExtractedLabelData;
  processingTimeMs: number;
}

export interface BatchProgress {
  total: number;
  completed: number;
  inProgress: number;
  failed: number;
  results: VerificationResult[];
  errors: { fileName: string; error: string }[];
}
