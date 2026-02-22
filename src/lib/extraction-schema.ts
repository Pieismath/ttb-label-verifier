export const EXTRACTION_SYSTEM_PROMPT = `You are a TTB (Alcohol and Tobacco Tax and Trade Bureau) label compliance expert. You are examining a photograph of an alcohol beverage label.

Extract ALL visible text from the label and organize it into the structured fields provided. Pay special attention to:

1. GOVERNMENT WARNING: Look for the mandatory health warning statement. Assess whether "GOVERNMENT WARNING:" appears in ALL CAPITALS and whether it appears BOLD (heavier weight than surrounding text). Assess whether the body text of the warning is NOT bold. Assess whether the warning appears visually separate from other label text.

2. Brand name: The primary commercial brand name of the product — typically the largest or most prominent text. Do NOT include sub-brand names, line names, or fanciful names (e.g., on a label with "JACKSE" as the brand and "Ghost Story" as a line name, extract only "JACKSE"). Do NOT include "Reserve", "Estate", "Select", etc. unless they are part of the core brand name.

3. Class/type: The TTB class or type designation — the legally required category of the beverage (e.g., "Kentucky Straight Bourbon Whiskey", "Cabernet Sauvignon", "India Pale Ale"). Do NOT include fanciful names, sub-brands, vineyard names, or marketing terms like "Reserve", "Estate Bottled", "Ghost Story", etc. Extract ONLY the regulatory class/type.

4. Alcohol content: The alcohol by volume statement. Common formats include "40% ALC/VOL", "Alc. 14.1% by Vol.", "13.5% ALC. BY VOL.", "ABV 5.0%". Extract the FULL statement exactly as printed, including any "Alc.", "by Vol.", "Proof" text.

5. Net contents: Volume statement (e.g., "750 mL", "12 FL OZ"). This may appear on any part of the label, or may not be visible if only one panel is shown. Set to null ONLY if genuinely not visible anywhere on the label.

6. Producer/bottler: Name and address of the responsible party. On wine labels this is often indicated by "Produced by", "Bottled by", "Estate Bottled", "Vinted by", etc. If no explicit prefix is present, the vineyard or estate name (e.g., "Jackse Estate Vineyard") IS the producer name, and the city/region below it (e.g., "St. Helena, Napa Valley") IS the producer address. Do NOT return null if this information is present in any form.

7. Country of origin: If visible (required for imported products).

8. Appellation of origin: For wines, the geographic designation (e.g., "Napa Valley"). Note: the same location text may serve as both appellation and producer address — extract it for BOTH fields.

9. Vintage year: For wines, the harvest year if shown.

10. Sulfites declaration: "Contains Sulfites" if present.

If a field is not visible or readable on the label, set it to null.
Set your confidence to 'low' if the image is blurry, partially obscured, or at a severe angle.
Add relevant notes about image quality issues in rawNotes.`;

export const extractionTool = {
  name: "record_label_data" as const,
  description:
    "Record all extracted data from the alcohol beverage label image",
  input_schema: {
    type: "object" as const,
    properties: {
      brandName: {
        type: ["string", "null"] as const,
        description:
          "The primary brand name only (the largest/most prominent commercial name). Exclude sub-brands, line names, fanciful names, and terms like 'Reserve' or 'Estate'.",
      },
      classTypeDesignation: {
        type: ["string", "null"] as const,
        description:
          "The TTB regulatory class/type designation ONLY (e.g., 'Cabernet Sauvignon', 'Kentucky Straight Bourbon Whiskey', 'India Pale Ale'). Exclude fanciful names, sub-brands, vineyard names, and marketing terms.",
      },
      alcoholContent: {
        type: ["string", "null"] as const,
        description:
          "The full alcohol content statement exactly as printed (e.g., '40% ALC/VOL', 'Alc. 14.1% by Vol.', '90 Proof'). Include surrounding text like 'Alc.', 'by Vol.', 'Proof'.",
      },
      netContents: {
        type: ["string", "null"] as const,
        description:
          "The net contents / volume statement (e.g., '750 mL', '12 FL OZ'). Null only if not visible on this label panel.",
      },
      producerName: {
        type: ["string", "null"] as const,
        description:
          "The name of the producer, bottler, distiller, importer, or estate/vineyard. On wine labels, the vineyard or estate name (e.g. 'Jackse Estate Vineyard') counts as the producer name even without a 'Produced by' prefix.",
      },
      producerAddress: {
        type: ["string", "null"] as const,
        description:
          "The address of the producer/bottler. On wine labels, the city and region (e.g. 'St. Helena, Napa Valley') counts as the producer address even if it also serves as the appellation.",
      },
      countryOfOrigin: {
        type: ["string", "null"] as const,
        description: "Country of origin if stated on the label",
      },
      appellation: {
        type: ["string", "null"] as const,
        description:
          "Appellation of origin for wines — the geographic designation (e.g., 'Napa Valley', 'St. Helena, Napa Valley', 'Willamette Valley'). The same text may also serve as the producer address.",
      },
      vintageYear: {
        type: ["string", "null"] as const,
        description:
          "The vintage/harvest year for wines (e.g., '2012', '2019'). Extract the four-digit year even if it is not explicitly labeled 'Vintage'.",
      },
      governmentWarning: {
        type: "object" as const,
        description: "Government Health Warning Statement analysis",
        properties: {
          present: {
            type: "boolean" as const,
            description: "Whether a Government Warning statement is present",
          },
          fullText: {
            type: ["string", "null"] as const,
            description:
              "The complete text of the warning statement as it appears on the label",
          },
          governmentWarningInCaps: {
            type: "boolean" as const,
            description:
              'Whether "GOVERNMENT WARNING:" appears in all capital letters',
          },
          governmentWarningAppearsBold: {
            type: "boolean" as const,
            description:
              'Whether "GOVERNMENT WARNING:" appears in bold/heavier type weight',
          },
          bodyTextAppearsBold: {
            type: "boolean" as const,
            description:
              "Whether the body text after GOVERNMENT WARNING: appears bold (should be false for compliance)",
          },
          separateFromOtherText: {
            type: "boolean" as const,
            description:
              "Whether the warning statement appears visually separate and apart from other label text",
          },
        },
        required: [
          "present",
          "fullText",
          "governmentWarningInCaps",
          "governmentWarningAppearsBold",
          "bodyTextAppearsBold",
          "separateFromOtherText",
        ],
      },
      sulfitesDeclaration: {
        type: ["string", "null"] as const,
        description: "'Contains Sulfites' declaration if present",
      },
      additionalText: {
        type: "array" as const,
        items: { type: "string" as const },
        description:
          "Any other notable text found on the label not captured in other fields",
      },
      confidence: {
        type: "string" as const,
        enum: ["high", "medium", "low"],
        description:
          "Confidence level in the extraction based on image quality",
      },
      rawNotes: {
        type: "string" as const,
        description:
          "Notes about image quality, readability issues, or other observations",
      },
    },
    required: [
      "brandName",
      "classTypeDesignation",
      "alcoholContent",
      "netContents",
      "producerName",
      "producerAddress",
      "countryOfOrigin",
      "appellation",
      "vintageYear",
      "governmentWarning",
      "sulfitesDeclaration",
      "additionalText",
      "confidence",
      "rawNotes",
    ],
  },
};
