import { GovernmentWarningExtraction, GovernmentWarningResult } from "./types";

export const REQUIRED_WARNING_TEXT =
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

/**
 * Normalize text for comparison: collapse whitespace, normalize punctuation,
 * strip smart quotes.
 */
function normalizeText(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * Similarity between two strings as a 0-100 score.
 */
function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase();
  const bLower = b.toLowerCase();
  if (aLower === bLower) return 100;
  const maxLen = Math.max(aLower.length, bLower.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(aLower, bLower);
  return Math.round((1 - dist / maxLen) * 100);
}

/**
 * Validate the Government Warning statement for compliance.
 * Checks: presence, text content (with tolerance for AI extraction),
 * and formatting (caps, bold, separation).
 */
export function validateGovernmentWarning(
  extracted: GovernmentWarningExtraction
): GovernmentWarningResult {
  const issues: string[] = [];

  if (!extracted.present || !extracted.fullText) {
    return {
      present: false,
      textCorrect: false,
      formattingCorrect: false,
      issues: ["Government Warning statement not found on label"],
    };
  }

  // Text content check — use fuzzy matching since AI extraction from
  // label images won't always produce a character-perfect transcription.
  const normalizedExtracted = normalizeText(extracted.fullText);
  const normalizedRequired = normalizeText(REQUIRED_WARNING_TEXT);
  const score = similarity(normalizedExtracted, normalizedRequired);

  // 97%+ similarity = pass (tolerates minor whitespace/punctuation differences
  // from AI extraction, but catches actual misspellings or wrong wording).
  const textCorrect = score >= 97;
  if (!textCorrect) {
    issues.push(
      `Government Warning text does not match required wording (${score}% similarity)`
    );
  }

  // "GOVERNMENT WARNING:" must be in all caps
  if (!extracted.governmentWarningInCaps) {
    issues.push('"GOVERNMENT WARNING:" is not in all capitals');
  }

  // "GOVERNMENT WARNING:" must appear bold
  if (!extracted.governmentWarningAppearsBold) {
    issues.push('"GOVERNMENT WARNING:" does not appear to be in bold type');
  }

  // Body text should NOT be bold
  if (extracted.bodyTextAppearsBold) {
    issues.push(
      "Warning body text appears to be in bold type (should not be bold)"
    );
  }

  // Must be separate from other text
  if (!extracted.separateFromOtherText) {
    issues.push(
      "Warning statement does not appear visually separate from other label text"
    );
  }

  const formattingCorrect =
    extracted.governmentWarningInCaps &&
    extracted.governmentWarningAppearsBold &&
    !extracted.bodyTextAppearsBold &&
    extracted.separateFromOtherText;

  return { present: true, textCorrect, formattingCorrect, issues };
}
