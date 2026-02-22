import {
  ApplicationData,
  ExtractedLabelData,
  FieldComparison,
  MatchStatus,
  VerificationResult,
} from "./types";
import { getFieldConfigs, getComparator } from "./field-requirements";
import { validateGovernmentWarning } from "./government-warning";

function generateNote(
  fieldName: string,
  expected: string,
  extracted: string,
  score: number,
  status: MatchStatus
): string {
  if (status === "match") return "Values match";
  if (status === "partial_match") {
    return `Similar (${score}% match) — minor differences in formatting or casing`;
  }
  if (fieldName === "alcoholContent") {
    return `Alcohol content mismatch: expected "${expected}", found "${extracted}"`;
  }
  if (fieldName === "netContents") {
    return `Net contents mismatch: expected "${expected}", found "${extracted}"`;
  }
  return `Mismatch (${score}% similarity): expected "${expected}", found "${extracted}"`;
}

/**
 * Compare extracted label data against application data.
 * Returns a full verification result with field-by-field comparisons.
 */
export function compareLabels(
  extracted: ExtractedLabelData,
  application: ApplicationData
): VerificationResult {
  const fieldConfigs = getFieldConfigs(application.beverageType);
  const comparisons: FieldComparison[] = [];

  for (const field of fieldConfigs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expectedValue = (application as any)[field.key] as string | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractedValue = (extracted as any)[field.key] as string | null;

    // If no expected value was provided, skip comparison
    if (!expectedValue || expectedValue.trim() === "") {
      if (extractedValue) {
        comparisons.push({
          fieldName: field.key,
          displayName: field.displayName,
          expected: null,
          extracted: extractedValue,
          status: "not_required",
          similarityScore: -1,
          notes: "Not provided in application — found on label",
        });
      }
      continue;
    }

    // Expected value exists but not found on label
    if (!extractedValue || extractedValue.trim() === "") {
      comparisons.push({
        fieldName: field.key,
        displayName: field.displayName,
        expected: expectedValue,
        extracted: null,
        status: "missing",
        similarityScore: 0,
        notes: "Required field not found on label",
      });
      continue;
    }

    // Both values exist — compare
    const comparator = getComparator(field);
    const score = comparator(expectedValue, extractedValue);
    const status: MatchStatus =
      score === 100
        ? "match"
        : score >= field.threshold
          ? "partial_match"
          : "mismatch";

    comparisons.push({
      fieldName: field.key,
      displayName: field.displayName,
      expected: expectedValue,
      extracted: extractedValue,
      status,
      similarityScore: score,
      notes: generateNote(field.key, expectedValue, extractedValue, score, status),
    });
  }

  // Government Warning check
  const gwResult = validateGovernmentWarning(extracted.governmentWarning);

  // Determine overall status — tolerant of AI extraction gaps.
  // Front-only labels commonly miss producer info / gov warning / net contents.
  // A few missing fields shouldn't auto-reject when most fields match.
  const mismatchCount = comparisons.filter((c) => c.status === "mismatch").length;
  const missingCount = comparisons.filter((c) => c.status === "missing").length;
  const comparedCount = comparisons.filter((c) => c.status !== "not_required").length;
  const hasGWIssues = gwResult.issues.length > 0;
  const hasPartialMatch = comparisons.some((c) => c.status === "partial_match");
  const gwMissingOnly =
    hasGWIssues && gwResult.issues.length === 1 && !gwResult.present;

  let overallStatus: "approved" | "needs_review" | "rejected";
  if (mismatchCount > 0) {
    // Actual value contradictions → rejected
    overallStatus = "rejected";
  } else if (missingCount >= comparedCount / 2) {
    // Half or more fields missing → rejected
    overallStatus = "rejected";
  } else if (missingCount > 0 || hasPartialMatch || gwMissingOnly) {
    // Some fields missing, partial matches, or gov warning not visible → needs review
    overallStatus = "needs_review";
  } else if (hasGWIssues) {
    // Gov warning present but has formatting/text issues → needs review
    overallStatus = "needs_review";
  } else {
    overallStatus = "approved";
  }

  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    imageFileName: "",
    beverageType: application.beverageType,
    overallStatus,
    fieldComparisons: comparisons,
    governmentWarningResult: gwResult,
    extractedData: extracted,
    processingTimeMs: 0,
  };
}
