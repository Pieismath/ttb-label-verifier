/**
 * Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
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
 * Normalize a string for comparison: lowercase, normalize quotes,
 * strip punctuation (keep apostrophes), collapse whitespace.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // smart single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // smart double quotes
    .replace(/[^\w\s']/g, " ") // strip punctuation except apostrophes
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Similarity score between two strings, 0-100.
 * 100 = identical after normalization.
 */
export function similarityScore(expected: string, extracted: string): number {
  const a = normalize(expected);
  const b = normalize(extracted);
  if (a === b) return 100;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  const distance = levenshteinDistance(a, b);
  return Math.round((1 - distance / maxLen) * 100);
}

/**
 * Extract the numeric percentage from an alcohol content string.
 * "40% ALC/VOL" → 40, "13.5% ALC. BY VOL." → 13.5
 */
export function extractAlcoholPercentage(text: string): number | null {
  const match = text.match(/([\d]+\.?[\d]*)\s*%/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Extract numeric value and unit from a net contents string.
 * "750 mL" → { value: 750, unit: "ml" }
 */
export function extractNetContents(
  text: string
): { value: number; unit: string } | null {
  const match = text.match(/([\d]+\.?[\d]*)\s*(ml|l|fl\.?\s*oz\.?|oz\.?|cl)/i);
  if (!match) return null;
  return {
    value: parseFloat(match[1]),
    unit: match[2].toLowerCase().replace(/[.\s]/g, ""),
  };
}

/**
 * Compare alcohol content strings by their numeric percentage.
 * Returns 100 if percentages match, 0 if they differ.
 */
export function compareAlcoholContent(
  expected: string,
  extracted: string
): number {
  const a = extractAlcoholPercentage(expected);
  const b = extractAlcoholPercentage(extracted);
  if (a === null || b === null) {
    // Fall back to fuzzy text match if we can't parse numbers
    return similarityScore(expected, extracted);
  }
  return a === b ? 100 : 0;
}

/**
 * Compare net contents strings by their numeric value and unit.
 * Returns 100 if they match, 0 if they differ.
 */
export function compareNetContents(
  expected: string,
  extracted: string
): number {
  const a = extractNetContents(expected);
  const b = extractNetContents(extracted);
  if (a === null || b === null) {
    return similarityScore(expected, extracted);
  }
  // Normalize units
  const normalizeUnit = (u: string) => {
    if (u === "l" || u === "cl") return "ml";
    if (u === "floz" || u === "oz") return "floz";
    return u;
  };
  const unitA = normalizeUnit(a.unit);
  const unitB = normalizeUnit(b.unit);
  // Convert liters/centiliters to ml for comparison
  const toMl = (value: number, unit: string) => {
    if (unit === "l") return value * 1000;
    if (unit === "cl") return value * 10;
    return value;
  };
  const valA = toMl(a.value, a.unit);
  const valB = toMl(b.value, b.unit);

  if (unitA === unitB || (unitA === "ml" && unitB === "ml")) {
    return valA === valB ? 100 : 0;
  }
  // Different unit families — fall back to text comparison
  return similarityScore(expected, extracted);
}
