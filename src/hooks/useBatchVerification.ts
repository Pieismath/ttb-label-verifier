"use client";

import { useState, useRef, useCallback } from "react";
import { ApplicationData, BatchProgress, VerificationResult } from "@/lib/types";
import { fileToBase64, getMediaType } from "@/lib/image-utils";

const CONCURRENCY = 5;

export function useBatchVerification() {
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    completed: 0,
    inProgress: 0,
    failed: 0,
    results: [],
    errors: [],
  });
  const [running, setRunning] = useState(false);
  const cancelledRef = useRef(false);

  const verifyOne = async (
    file: File,
    applicationData: ApplicationData
  ): Promise<VerificationResult> => {
    const mediaType = getMediaType(file);
    if (!mediaType) throw new Error("Unsupported image format");

    const imageBase64 = await fileToBase64(file);
    const response = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, mediaType, applicationData }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Verification failed");
    }

    const result: VerificationResult = await response.json();
    result.imageFileName = file.name;
    return result;
  };

  const runBatch = useCallback(
    async (files: File[], applicationData: ApplicationData) => {
      cancelledRef.current = false;
      setRunning(true);
      setProgress({
        total: files.length,
        completed: 0,
        inProgress: 0,
        failed: 0,
        results: [],
        errors: [],
      });

      const results: VerificationResult[] = [];
      const errors: { fileName: string; error: string }[] = [];
      let completed = 0;
      let failed = 0;

      // Process in batches of CONCURRENCY
      for (let i = 0; i < files.length; i += CONCURRENCY) {
        if (cancelledRef.current) break;

        const batch = files.slice(i, i + CONCURRENCY);

        setProgress((prev) => ({
          ...prev,
          inProgress: batch.length,
        }));

        const batchResults = await Promise.allSettled(
          batch.map((file) => verifyOne(file, applicationData))
        );

        for (let j = 0; j < batchResults.length; j++) {
          const br = batchResults[j];
          if (br.status === "fulfilled") {
            results.push(br.value);
            completed++;
          } else {
            errors.push({
              fileName: batch[j].name,
              error: br.reason?.message ?? "Unknown error",
            });
            failed++;
          }
        }

        setProgress({
          total: files.length,
          completed,
          inProgress: 0,
          failed,
          results: [...results],
          errors: [...errors],
        });
      }

      setRunning(false);
    },
    []
  );

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setRunning(false);
    setProgress({
      total: 0,
      completed: 0,
      inProgress: 0,
      failed: 0,
      results: [],
      errors: [],
    });
  }, []);

  return { runBatch, progress, running, cancel, reset };
}
