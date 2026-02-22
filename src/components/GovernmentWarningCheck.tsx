"use client";

import { GovernmentWarningResult } from "@/lib/types";

interface Props {
  result: GovernmentWarningResult;
}

interface CheckItem {
  label: string;
  passed: boolean;
}

export default function GovernmentWarningCheck({ result }: Props) {
  if (!result.present) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h4 className="text-sm font-semibold text-red-800 mb-1">
          Government Warning Statement
        </h4>
        <p className="text-sm text-red-700">
          Warning statement not found on label
        </p>
      </div>
    );
  }

  const checks: CheckItem[] = [
    { label: "Warning statement present", passed: result.present },
    { label: "Text matches required wording", passed: result.textCorrect },
    { label: "Formatting is compliant", passed: result.formattingCorrect },
  ];

  const allPassed = result.issues.length === 0;

  return (
    <div
      className={`rounded-lg border p-4 ${
        allPassed
          ? "border-green-200 bg-green-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <h4
        className={`text-sm font-semibold mb-3 ${
          allPassed ? "text-green-800" : "text-red-800"
        }`}
      >
        Government Warning Statement
      </h4>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-2 text-sm">
            {check.passed ? (
              <svg
                className="h-4 w-4 text-green-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4 text-red-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className={check.passed ? "text-green-700" : "text-red-700"}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
      {result.issues.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-xs font-medium text-red-800 mb-1">Issues:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {result.issues.map((issue, i) => (
              <li key={i} className="text-xs text-red-700">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
