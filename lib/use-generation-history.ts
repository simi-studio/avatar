"use client";

import { useCallback, useEffect, useState } from "react";

import type { AvatarIntent } from "@/lib/avatar-intent";
import {
  addHistoryEntry,
  clearHistory,
  readHistory,
  type HistoryEntry,
} from "@/lib/local-history";

export type GenerationHistory = {
  entries: HistoryEntry[];
  record: (intent: AvatarIntent) => void;
  clear: () => void;
};

/**
 * Browser-local generation history. Hydrated after mount to avoid an SSR
 * mismatch, since `localStorage` is unavailable on the server.
 */
export function useGenerationHistory(): GenerationHistory {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(readHistory());
  }, []);

  const record = useCallback((intent: AvatarIntent) => {
    setEntries(addHistoryEntry(intent));
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setEntries([]);
  }, []);

  return { entries, record, clear };
}
