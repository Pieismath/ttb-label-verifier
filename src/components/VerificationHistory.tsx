"use client";

import { useState } from "react";
import { ApplicationData } from "@/lib/types";
import { HistoryEntry } from "@/hooks/useVerificationHistory";
import VerificationResultCard from "./VerificationResult";

interface Props {
  history: HistoryEntry[];
  onClear: () => void;
  onLoadData?: (data: ApplicationData) => void;
}

const statusBadge = {
  approved: "bg-green-100 text-green-700",
  needs_review: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-700",
};

const statusLabel = {
  approved: "Approved",
  needs_review: "Needs Review",
  rejected: "Rejected",
};

export default function VerificationHistory({ history, onClear, onLoadData }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const approved = history.filter((e) => e.result.overallStatus === "approved").length;
  const needsReview = history.filter((e) => e.result.overallStatus === "needs_review").length;
  const rejected = history.filter((e) => e.result.overallStatus === "rejected").length;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Verification History
          </h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">{history.length} total</span>
            {approved > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                {approved} approved
              </span>
            )}
            {needsReview > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                {needsReview} review
              </span>
            )}
            {rejected > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                {rejected} rejected
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 font-medium"
        >
          Clear history
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-2 font-medium text-gray-500">
                Date
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">
                Brand
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">
                Type
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">
                Image
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">
                Status
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-500">
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry) => (
              <tr key={entry.id} className="group">
                <td colSpan={6} className="p-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expandedId === entry.id ? null : entry.id
                      )
                    }
                    className="w-full text-left grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.5fr)] px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50"
                  >
                    <span className="text-gray-500 truncate">
                      {new Date(entry.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="font-medium text-gray-900 truncate">
                      {entry.applicationData.brandName}
                    </span>
                    <span className="text-gray-500 capitalize truncate">
                      {entry.applicationData.beverageType}
                    </span>
                    <span className="text-gray-500 truncate">
                      {entry.result.imageFileName || "—"}
                    </span>
                    <span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusBadge[entry.result.overallStatus]}`}
                      >
                        {statusLabel[entry.result.overallStatus]}
                      </span>
                    </span>
                    <span className="text-gray-400 text-right">
                      {(entry.result.processingTimeMs / 1000).toFixed(1)}s
                    </span>
                  </button>
                  {expandedId === entry.id && (
                    <div className="px-4 pb-4 bg-gray-50/50">
                      {onLoadData && (
                        <div className="mb-3 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadData(entry.applicationData);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                            </svg>
                            Re-verify with this application data
                          </button>
                        </div>
                      )}
                      <VerificationResultCard result={entry.result} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
