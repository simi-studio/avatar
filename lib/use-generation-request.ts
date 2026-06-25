"use client";

import { useCallback, useState } from "react";

import { CLIENT_TIMEOUT_MS, type ErrorCode } from "@/lib/constants";
import type { AvatarIntent } from "@/lib/avatar-intent";
import type { GeneratedImage, GenerateResponse } from "@/lib/types";
import type { GenerationStatus } from "@/components/result-preview";

export type RunGenerationOptions = {
  intent: AvatarIntent;
  apiKey: string;
  /** Build the multipart request body for the given intent. */
  buildForm: (intent: AvatarIntent) => FormData;
  /** Invoked once with the request intent after a successful generation. */
  onSuccess?: (intent: AvatarIntent) => void;
};

export type GenerationRequest = {
  status: GenerationStatus;
  images: GeneratedImage[];
  errorCode: ErrorCode | null;
  lastIntent: AvatarIntent | null;
  run: (options: RunGenerationOptions) => Promise<void>;
};

/**
 * Owns the generation request lifecycle: status, returned images, normalized
 * error code, and the last submitted intent (for retry). The caller supplies the
 * request body so provider/upload state stays in the form component.
 */
export function useGenerationRequest(): GenerationRequest {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [lastIntent, setLastIntent] = useState<AvatarIntent | null>(null);

  const run = useCallback(
    async ({ intent, apiKey, buildForm, onSuccess }: RunGenerationOptions) => {
      if (!apiKey) {
        setErrorCode("MISSING_API_KEY");
        setStatus("error");
        return;
      }
      setLastIntent(intent);
      setStatus("generating");
      setErrorCode(null);
      setImages([]);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          body: buildForm(intent),
          signal: controller.signal,
        });
        const data = (await res.json()) as GenerateResponse;
        if (data.success && data.images) {
          setImages(data.images);
          setStatus("success");
          onSuccess?.(intent);
        } else {
          setErrorCode(data.error?.code ?? "UNKNOWN_ERROR");
          setStatus("error");
        }
      } catch (error) {
        setErrorCode(
          error instanceof DOMException && error.name === "AbortError"
            ? "PROVIDER_TIMEOUT"
            : "UNKNOWN_ERROR",
        );
        setStatus("error");
      } finally {
        clearTimeout(timer);
      }
    },
    [],
  );

  return { status, images, errorCode, lastIntent, run };
}
