"use client";

import { BeverageType } from "@/lib/types";

interface Props {
  value: BeverageType;
  onChange: (type: BeverageType) => void;
}

const options: { value: BeverageType; label: string; icon: string }[] = [
  { value: "spirits", label: "Distilled Spirits", icon: "🥃" },
  { value: "wine", label: "Wine", icon: "🍷" },
  { value: "beer", label: "Beer / Malt Beverage", icon: "🍺" },
];

export default function BeverageTypeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
            value === opt.value
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <span className="text-lg" role="img" aria-label={opt.label}>
            {opt.icon}
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
