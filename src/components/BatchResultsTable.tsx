"use client";

import { useState, useEffect } from "react";
import { BatchProgress, VerificationResult } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import VerificationResultCard from "./VerificationResult";

interface Props {
  progress: BatchProgress;
  running: boolean;
  onCancel: () => void;
}

const statusBadge = {
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  needs_review: {
    label: "Review",
    className: "bg-yellow-100 text-yellow-800",
  },
  rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
};

function downloadCSV(results: VerificationResult[]) {
  const headers = [
    "File",
    "Status",
    "Brand Name Match",
    "Class/Type Match",
    "Alcohol Content Match",
    "Net Contents Match",
    "Gov Warning Present",
    "Gov Warning Text Correct",
    "Gov Warning Format Correct",
    "Issues",
    "Processing Time (s)",
  ];

  const rows = results.map((r) => {
    const fieldStatus = (name: string) => {
      const f = r.fieldComparisons.find((c) => c.fieldName === name);
      return f ? f.status : "n/a";
    };
    const gw = r.governmentWarningResult;
    return [
      r.imageFileName,
      r.overallStatus,
      fieldStatus("brandName"),
      fieldStatus("classTypeDesignation"),
      fieldStatus("alcoholContent"),
      fieldStatus("netContents"),
      gw.present ? "Yes" : "No",
      gw.textCorrect ? "Yes" : "No",
      gw.formattingCorrect ? "Yes" : "No",
      gw.issues.join("; "),
      (r.processingTimeMs / 1000).toFixed(1),
    ];
  });

  const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `label-verification-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BatchResultsTable({
  progress,
  running,
  onCancel,
}: Props) {
  const [selectedResult, setSelectedResult] =
    useState<VerificationResult | null>(null);

  // Close detail modal on Escape key
  useEffect(() => {
    if (!selectedResult) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedResult(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedResult]);

  const percent =
    progress.total > 0
      ? Math.round(((progress.completed + progress.failed) / progress.total) * 100)
      : 0;

  const approved = progress.results.filter(
    (r) => r.overallStatus === "approved"
  ).length;
  const needsReview = progress.results.filter(
    (r) => r.overallStatus === "needs_review"
  ).length;
  const rejected = progress.results.filter(
    (r) => r.overallStatus === "rejected"
  ).length;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {running
              ? `Processing: ${progress.completed + progress.failed} / ${progress.total}`
              : `Completed: ${progress.completed + progress.failed} / ${progress.total}`}
          </span>
          {running && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <Progress value={percent} />
      </div>

      {/* Summary badges */}
      {progress.results.length > 0 && (
        <div className="flex gap-3">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            {approved} Approved
          </Badge>
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            {needsReview} Needs Review
          </Badge>
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            {rejected} Rejected
          </Badge>
          {progress.failed > 0 && (
            <Badge variant="outline" className="bg-gray-50 text-gray-700">
              {progress.failed} Errors
            </Badge>
          )}
        </div>
      )}

      {/* Results table */}
      {progress.results.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">#</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[80px]">Issues</TableHead>
                <TableHead className="w-[80px]">Time</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {progress.results.map((r, i) => {
                const issueCount =
                  r.fieldComparisons.filter(
                    (c) => c.status === "mismatch" || c.status === "missing"
                  ).length + r.governmentWarningResult.issues.length;
                const sb = statusBadge[r.overallStatus];
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-gray-400 text-xs">
                      {i + 1}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {r.imageFileName}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${sb.className}`}
                      >
                        {sb.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {issueCount > 0 ? issueCount : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-400">
                      {(r.processingTimeMs / 1000).toFixed(1)}s
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedResult(r)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {progress.errors.map((err, i) => (
                <TableRow key={`err-${i}`}>
                  <TableCell className="text-gray-400 text-xs">
                    {progress.results.length + i + 1}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {err.fileName}
                  </TableCell>
                  <TableCell>
                    <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                      Error
                    </span>
                  </TableCell>
                  <TableCell colSpan={3} className="text-sm text-red-600">
                    {err.error}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!running && (
            <Button
              variant="outline"
              onClick={() => downloadCSV(progress.results)}
            >
              Export Results as CSV
            </Button>
          )}
        </>
      )}

      {/* Detail view modal */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedResult.imageFileName}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedResult(null)}
              >
                Close
              </Button>
            </div>
            <VerificationResultCard result={selectedResult} />
          </div>
        </div>
      )}
    </div>
  );
}
