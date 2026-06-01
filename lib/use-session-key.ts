"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "simi-avatar-api-key";

/**
 * Hold the API key in component state, optionally mirrored to `sessionStorage`
 * for the current browser session only. The key is never written anywhere else.
 */
export function useSessionApiKey() {
  const [apiKey, setApiKeyState] = useState("");
  const [saveForSession, setSaveForSession] = useState(false);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        setApiKeyState(stored);
        setSaveForSession(true);
      }
    } catch {
      // Ignore storage access errors (e.g. privacy mode).
    }
  }, []);

  const persist = useCallback((value: string, save: boolean) => {
    try {
      if (save && value) {
        window.sessionStorage.setItem(SESSION_KEY, value);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  const setApiKey = useCallback(
    (value: string) => {
      setApiKeyState(value);
      persist(value, saveForSession);
    },
    [persist, saveForSession],
  );

  const toggleSave = useCallback(
    (save: boolean) => {
      setSaveForSession(save);
      persist(apiKey, save);
    },
    [apiKey, persist],
  );

  const clear = useCallback(() => {
    setApiKeyState("");
    setSaveForSession(false);
    persist("", false);
  }, [persist]);

  return { apiKey, setApiKey, saveForSession, toggleSave, clear };
}
