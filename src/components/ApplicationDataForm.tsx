"use client";

import { ApplicationData, BeverageType } from "@/lib/types";
import { Input } from "@/components/ui/input";

interface Props {
  data: ApplicationData;
  onChange: (data: ApplicationData) => void;
}

interface FieldDef {
  key: keyof ApplicationData;
  label: string;
  placeholder: string;
  types?: BeverageType[];
}

const fields: FieldDef[] = [
  {
    key: "brandName",
    label: "Brand Name *",
    placeholder: 'e.g., "OLD TOM DISTILLERY"',
  },
  {
    key: "classTypeDesignation",
    label: "Class/Type Designation",
    placeholder: 'e.g., "Kentucky Straight Bourbon Whiskey"',
  },
  {
    key: "alcoholContent",
    label: "Alcohol Content",
    placeholder: 'e.g., "45% Alc./Vol. (90 Proof)"',
  },
  {
    key: "netContents",
    label: "Net Contents",
    placeholder: 'e.g., "750 mL"',
  },
  {
    key: "producerName",
    label: "Producer/Bottler Name",
    placeholder: 'e.g., "Old Tom Distillery, LLC"',
  },
  {
    key: "producerAddress",
    label: "Producer/Bottler Address",
    placeholder: 'e.g., "Louisville, Kentucky"',
  },
  {
    key: "countryOfOrigin",
    label: "Country of Origin (if imported)",
    placeholder: 'e.g., "Scotland"',
  },
  {
    key: "appellation",
    label: "Appellation of Origin",
    placeholder: 'e.g., "Napa Valley"',
    types: ["wine"],
  },
  {
    key: "vintageYear",
    label: "Vintage Year",
    placeholder: 'e.g., "2019"',
    types: ["wine"],
  },
];

export default function ApplicationDataForm({ data, onChange }: Props) {
  const visibleFields = fields.filter(
    (f) => !f.types || f.types.includes(data.beverageType)
  );

  const handleChange = (key: keyof ApplicationData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {visibleFields.map((field) => (
        <div key={field.key} className={field.key === "producerAddress" ? "md:col-span-2" : ""}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          <Input
            type="text"
            value={(data[field.key] as string) ?? ""}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        </div>
      ))}
    </div>
  );
}
