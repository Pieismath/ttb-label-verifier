import { BeverageType } from "./types";
import {
  similarityScore,
  compareAlcoholContent,
  compareNetContents,
} from "./fuzzy-match";

export interface FieldConfig {
  key: string;
  displayName: string;
  threshold: number; // Minimum score for partial_match
  comparator?: (expected: string, extracted: string) => number;
}

const COMMON_FIELDS: FieldConfig[] = [
  {
    key: "brandName",
    displayName: "Brand Name",
    threshold: 85,
  },
  {
    key: "classTypeDesignation",
    displayName: "Class/Type",
    threshold: 80,
  },
  {
    key: "alcoholContent",
    displayName: "Alcohol Content",
    threshold: 100,
    comparator: compareAlcoholContent,
  },
  {
    key: "netContents",
    displayName: "Net Contents",
    threshold: 100,
    comparator: compareNetContents,
  },
  {
    key: "producerName",
    displayName: "Producer/Bottler Name",
    threshold: 80,
  },
  {
    key: "producerAddress",
    displayName: "Producer/Bottler Address",
    threshold: 75,
  },
];

const IMPORT_FIELD: FieldConfig = {
  key: "countryOfOrigin",
  displayName: "Country of Origin",
  threshold: 90,
};

const WINE_FIELDS: FieldConfig[] = [
  {
    key: "appellation",
    displayName: "Appellation of Origin",
    threshold: 85,
  },
  {
    key: "vintageYear",
    displayName: "Vintage Year",
    threshold: 100,
  },
];

/**
 * Get the list of fields to compare for a given beverage type.
 * Only includes fields that are applicable and have expected values.
 */
export function getFieldConfigs(beverageType: BeverageType): FieldConfig[] {
  const fields = [...COMMON_FIELDS];

  // Country of origin is always checked if provided
  fields.push(IMPORT_FIELD);

  if (beverageType === "wine") {
    fields.push(...WINE_FIELDS);
  }

  return fields;
}

/**
 * Get the default comparator for a field (fuzzy similarity).
 */
export function getComparator(
  field: FieldConfig
): (expected: string, extracted: string) => number {
  return field.comparator ?? similarityScore;
}
