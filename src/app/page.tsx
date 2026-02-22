"use client";

import { useState, useRef, useEffect } from "react";
import { ApplicationData, BeverageType } from "@/lib/types";
import Header from "@/components/Header";
import BeverageTypeSelector from "@/components/BeverageTypeSelector";
import ApplicationDataForm from "@/components/ApplicationDataForm";
import ImageUploader from "@/components/ImageUploader";
import VerificationResultCard from "@/components/VerificationResult";
import BatchResultsTable from "@/components/BatchResultsTable";
import { Button } from "@/components/ui/button";
import VerificationHistory from "@/components/VerificationHistory";
import { useVerification } from "@/hooks/useVerification";
import { useBatchVerification } from "@/hooks/useBatchVerification";
import { useVerificationHistory } from "@/hooks/useVerificationHistory";

const EMPTY_APPLICATION: ApplicationData = {
  beverageType: "spirits",
  brandName: "",
  classTypeDesignation: "",
  alcoholContent: "",
  netContents: "",
  producerName: "",
  producerAddress: "",
  countryOfOrigin: "",
  appellation: "",
  vintageYear: "",
};

const SAMPLE_APPLICATION: ApplicationData = {
  beverageType: "spirits",
  brandName: "OLD TOM DISTILLERY",
  classTypeDesignation: "Kentucky Straight Bourbon Whiskey",
  alcoholContent: "45% Alc./Vol. (90 Proof)",
  netContents: "750 mL",
  producerName: "Old Tom Distillery, LLC",
  producerAddress: "Louisville, Kentucky",
  countryOfOrigin: "",
  appellation: "",
  vintageYear: "",
};

export default function Home() {
  const [applicationData, setApplicationData] =
    useState<ApplicationData>(EMPTY_APPLICATION);
  const [files, setFiles] = useState<File[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const singleVerification = useVerification();
  const batchVerification = useBatchVerification();
  const verificationHistory = useVerificationHistory();

  const isBatch = files.length > 1;
  const isProcessing = singleVerification.loading || batchVerification.running;

  const hasResults =
    singleVerification.result ||
    batchVerification.progress.results.length > 0;

  const hasBatchActivity =
    batchVerification.running ||
    batchVerification.progress.results.length > 0 ||
    batchVerification.progress.errors.length > 0;

  // Auto-scroll to top when results first arrive
  const prevHasResults = useRef(false);
  useEffect(() => {
    if (hasResults && !prevHasResults.current) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
    prevHasResults.current = !!hasResults;
  }, [hasResults]);

  // Save single verification results to history
  const lastSavedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (singleVerification.result && singleVerification.result.id !== lastSavedIdRef.current) {
      lastSavedIdRef.current = singleVerification.result.id;
      verificationHistory.addEntry(applicationData, singleVerification.result);
    }
  }, [singleVerification.result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Collapse form when results exist (derived, not set in effect)
  const formVisible = showForm || !hasResults;

  const handleBeverageTypeChange = (type: BeverageType) => {
    setApplicationData((prev) => ({ ...prev, beverageType: type }));
  };

  const handleVerify = async () => {
    if (files.length === 0) return;
    setShowForm(false);
    setElapsedSeconds(0);

    if (isBatch) {
      batchVerification.runBatch(files, applicationData);
    } else {
      // Store image preview URL for side-by-side display
      setResultImageUrl(URL.createObjectURL(files[0]));
      singleVerification.verify(files[0], applicationData);
    }
  };

  const handleTrySample = () => {
    setApplicationData(SAMPLE_APPLICATION);
  };

  const handleReset = () => {
    setApplicationData(EMPTY_APPLICATION);
    setFiles([]);
    setResultImageUrl(null);
    singleVerification.reset();
    batchVerification.reset();
    setShowForm(true);
  };

  const handleNewVerification = () => {
    // Keep application data, only clear image + result
    setFiles([]);
    setResultImageUrl(null);
    singleVerification.reset();
    setShowForm(true);
  };

  const handleLoadFromHistory = (data: ApplicationData) => {
    setApplicationData(data);
    setFiles([]);
    setResultImageUrl(null);
    singleVerification.reset();
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Live timer for processing feedback
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const canVerify =
    files.length > 0 && applicationData.brandName.trim() !== "" && !isProcessing;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Processing indicator — shown at top when analyzing */}
        {isProcessing && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Analyzing label{isBatch ? "s" : ""}...
                </p>
                <p className="text-xs text-blue-600">
                  Extracting text and comparing against application data
                </p>
              </div>
            </div>
            <span className="text-sm font-mono text-blue-600 tabular-nums">
              {elapsedSeconds}s
            </span>
          </div>
        )}

        {/* Error */}
        {singleVerification.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
            <span className="font-medium">Error:</span>{" "}
            {singleVerification.error}
          </div>
        )}

        {/* Results — shown ABOVE the form, at the top */}
        {singleVerification.result && (
          <div ref={resultsRef} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Verification Results
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleNewVerification}>
                  Verify Another
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Start Over
                </Button>
              </div>
            </div>
            <VerificationResultCard result={singleVerification.result} imageUrl={resultImageUrl} />
          </div>
        )}

        {hasBatchActivity && (
          <div ref={resultsRef} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Batch Results
              </h2>
              {!batchVerification.running && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Start Over
                </Button>
              )}
            </div>
            <BatchResultsTable
              progress={batchVerification.progress}
              running={batchVerification.running}
              onCancel={batchVerification.cancel}
            />
          </div>
        )}

        {/* Form — collapsible after results arrive */}
        {!formVisible ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full text-center py-3 text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded-xl hover:border-gray-400 transition-colors"
          >
            Show application form
          </button>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Step 1: Beverage type selector */}
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#1b3e6e] text-white text-xs font-bold">1</span>
                <span className="text-sm font-semibold text-gray-900">Select beverage type</span>
              </div>
              <BeverageTypeSelector
                value={applicationData.beverageType}
                onChange={handleBeverageTypeChange}
              />
            </div>

            {/* Two-column layout: form on left, upload on right */}
            <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              {/* Step 2: Application data form */}
              <div className="lg:col-span-3 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#1b3e6e] text-white text-xs font-bold">2</span>
                    <span className="text-sm font-semibold text-gray-900">Enter application data</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTrySample}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Load sample data
                  </button>
                </div>
                <ApplicationDataForm
                  data={applicationData}
                  onChange={setApplicationData}
                />
              </div>

              {/* Step 3: Upload area */}
              <div className="lg:col-span-2 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[#1b3e6e] text-white text-xs font-bold">3</span>
                  <span className="text-sm font-semibold text-gray-900">Upload label image{files.length > 1 ? "s" : ""}</span>
                </div>
                <ImageUploader files={files} onFilesChange={setFiles} />
              </div>
            </div>

            {/* Step 4: Action bar */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {files.length === 0
                  ? "Upload a label image to begin"
                  : !applicationData.brandName.trim()
                    ? "Enter at least a brand name"
                    : `Ready to verify ${files.length} ${files.length === 1 ? "label" : "labels"}`}
              </div>
              <div className="flex gap-3">
                {hasResults && (
                  <Button variant="outline" onClick={handleReset}>
                    Start Over
                  </Button>
                )}
                <Button
                  onClick={handleVerify}
                  disabled={!canVerify}
                  size="lg"
                  className="px-8 bg-[#1b3e6e] hover:bg-[#152f54]"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analyzing...
                    </span>
                  ) : isBatch ? (
                    `Verify ${files.length} Labels`
                  ) : (
                    "Verify Label"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Verification history */}
        <VerificationHistory
          history={verificationHistory.history}
          onClear={verificationHistory.clearHistory}
          onLoadData={handleLoadFromHistory}
        />
      </main>

      {/* Government-style footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <p className="text-xs text-gray-400 text-center">
            Label Verification Tool — Prototype for internal TTB compliance use only.
            This tool assists with label review and does not constitute a final determination.
            All verification results should be confirmed by a compliance agent.
          </p>
        </div>
      </footer>
    </div>
  );
}
