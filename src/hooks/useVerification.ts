"use client";

import { useState } from "react";
import { ApplicationData, VerificationResult } from "@/lib/types";
import { fileToBase64, getMediaType } from "@/lib/image-utils";

export function useVerification() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify(file: File, applicationData: ApplicationData) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const mediaType = getMediaType(file);
      if (!mediaType) {
        throw new Error("Unsupported image format");
      }

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

      const verificationResult: VerificationResult = await response.json();
      verificationResult.imageFileName = file.name;
      setResult(verificationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return { verify, loading, result, error, reset };
}
