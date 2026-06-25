"use client";

import { useEffect, useState } from "react";

import {
  MINIMAX_REGIONS,
  PROVIDERS,
  type MiniMaxRegion,
  type ProviderId,
} from "@/lib/constants";

const SESSION_PROVIDER_KEY = "simi-avatar-provider";
const SESSION_REGION_KEY = "simi-avatar-minimax-region";

export type ProviderSession = {
  provider: ProviderId;
  setProvider: (provider: ProviderId) => void;
  region: MiniMaxRegion;
  setRegion: (region: MiniMaxRegion) => void;
};

/**
 * Provider + MiniMax region selection, optionally persisted to `sessionStorage`
 * alongside a saved API key. Region is only persisted for MiniMax.
 *
 * @param persist  Whether the current selection should be saved for the session.
 * @param hydrated Whether the dependent key store has hydrated; persistence is
 *                 deferred until then to avoid clobbering a restored selection.
 */
export function useProviderSession({
  persist,
  hydrated,
}: {
  persist: boolean;
  hydrated: boolean;
}): ProviderSession {
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [region, setRegion] = useState<MiniMaxRegion>("global");

  useEffect(() => {
    try {
      const storedProvider = window.sessionStorage.getItem(SESSION_PROVIDER_KEY);
      const storedRegion = window.sessionStorage.getItem(SESSION_REGION_KEY);
      if (PROVIDERS.includes(storedProvider as ProviderId)) {
        setProvider(storedProvider as ProviderId);
      }
      if (MINIMAX_REGIONS.includes(storedRegion as MiniMaxRegion)) {
        setRegion(storedRegion as MiniMaxRegion);
      }
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (persist) {
        window.sessionStorage.setItem(SESSION_PROVIDER_KEY, provider);
        if (provider === "minimax") {
          window.sessionStorage.setItem(SESSION_REGION_KEY, region);
        } else {
          window.sessionStorage.removeItem(SESSION_REGION_KEY);
        }
      } else {
        window.sessionStorage.removeItem(SESSION_PROVIDER_KEY);
        window.sessionStorage.removeItem(SESSION_REGION_KEY);
      }
    } catch {
      // Ignore storage access errors.
    }
  }, [persist, hydrated, provider, region]);

  return { provider, setProvider, region, setRegion };
}
