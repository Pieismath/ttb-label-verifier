"use client";

import { useState } from "react";
import { VerificationResult as VerificationResultType } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ComparisonDetail from "./ComparisonDetail";
import GovernmentWarningCheck from "./GovernmentWarningCheck";

interface Props {
  result: VerificationResultType;
  imageUrl?: string | null;
}

const statusConfig = {
  approved: {
    label: "APPROVED",
    className: "bg-green-100 text-green-800 border-green-300",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  needs_review: {
    label: "NEEDS REVIEW",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
  rejected: {
    label: "REJECTED",
    className: "bg-red-100 text-red-800 border-red-300",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const extractionFields: { key: string; label: string }[] = [
  { key: "brandName", label: "Brand Name" },
  { key: "classTypeDesignation", label: "Class/Type" },
  { key: "alcoholContent", label: "Alcohol Content" },
  { key: "netContents", label: "Net Contents" },
  { key: "producerName", label: "Producer Name" },
  { key: "producerAddress", label: "Producer Address" },
  { key: "countryOfOrigin", label: "Country of Origin" },
  { key: "appellation", label: "Appellation" },
  { key: "vintageYear", label: "Vintage Year" },
  { key: "sulfitesDeclaration", label: "Sulfites" },
];

export default function VerificationResultCard({ result, imageUrl }: Props) {
  const status = statusConfig[result.overallStatus];
  const [showExtracted, setShowExtracted] = useState(false);

  const resultContent = (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-semibold text-sm ${status.className}`}
            >
              {status.icon}
              {status.label}
            </div>
            {result.imageFileName && (
              <span className="text-sm text-gray-500">
                {result.imageFileName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="text-xs text-gray-400 hover:text-gray-600 print:hidden"
              title="Print results"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
            </button>
            <span className="text-sm text-gray-400">
              {(result.processingTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
        {result.extractedData.confidence !== "high" && (
          <div className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 flex items-start gap-2">
            <svg className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {result.extractedData.confidence === "low" ? "Low" : "Medium"} confidence extraction
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">
                {result.extractedData.rawNotes || "Image quality may affect accuracy. Consider re-uploading a clearer photo."}
              </p>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ComparisonDetail comparisons={result.fieldComparisons} />
        <GovernmentWarningCheck result={result.governmentWarningResult} />

        {/* Extracted text preview */}
        <div className="border-t border-gray-100 pt-3">
          <button
            type="button"
            onClick={() => setShowExtracted(!showExtracted)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className={`h-4 w-4 transition-transform ${showExtracted ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            AI Extraction Details
            <span className="text-xs text-gray-400">
              ({result.extractedData.confidence} confidence)
            </span>
          </button>
          {showExtracted && (
            <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {extractionFields.map(({ key, label }) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const value = (result.extractedData as any)[key] as string | null;
                  return (
                    <div key={key} className="contents">
                      <span className="text-gray-500 font-medium">{label}</span>
                      <span className={value ? "text-gray-900" : "text-gray-300 italic"}>
                        {value || "Not found"}
                      </span>
                    </div>
                  );
                })}
              </div>
              {result.extractedData.additionalText.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">Additional text found:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {result.extractedData.additionalText.map((text, i) => (
                      <li key={i} className="text-xs text-gray-600">{text}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.extractedData.rawNotes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-500 mb-1">AI Notes:</p>
                  <p className="text-xs text-gray-600">{result.extractedData.rawNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Side-by-side layout when image URL is available
  if (imageUrl) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        <div className="hidden lg:block">
          <div className="sticky top-4 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={result.imageFileName || "Label image"}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        <div>{resultContent}</div>
      </div>
    );
  }

  return resultContent;
}
