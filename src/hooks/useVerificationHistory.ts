"use client";

import { useState, useCallback, useEffect } from "react";
import { VerificationResult, ApplicationData } from "@/lib/types";

export interface HistoryEntry {
  id: string;
  timestamp: string;
  applicationData: ApplicationData;
  result: VerificationResult;
}

const STORAGE_KEY = "ttb-verification-history";
const MAX_ENTRIES = 50;

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useVerificationHistory() {
  // Start empty to match SSR, then hydrate from localStorage on mount
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory()); // eslint-disable-line react-hooks/exhaustive-deps -- hydrate from external store on mount
  }, []);

  const addEntry = useCallback(
    (applicationData: ApplicationData, result: VerificationResult) => {
      setHistory((prev) => {
        const entry: HistoryEntry = {
          id: result.id,
          timestamp: result.timestamp,
          applicationData,
          result,
        };
        const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(updated);
        return updated;
      });
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { history, addEntry, clearHistory };
}
