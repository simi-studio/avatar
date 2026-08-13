"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CLIENT_TIMEOUT_MS, type ErrorCode } from "@/lib/constants";
import type { AvatarIntent } from "@/lib/avatar-intent";
import type { GeneratedImage, GenerateResponse } from "@/lib/types";
import type { GenerationStatus } from "@/components/result-preview";

export type RunGenerationOptions = {
  intent: AvatarIntent;
  apiKey: string;
  /** Build the multipart request body for the given intent. */
  buildForm: (intent: AvatarIntent) => FormData;
  /** Keep the displayed candidate visible if this follow-up request fails. */
  preserveExistingImages?: boolean;
  /** Invoked once with the request intent and images after a successful call. */
  onSuccess?: (intent: AvatarIntent, images: GeneratedImage[]) => void;
};

export type GenerationRequest = {
  status: GenerationStatus;
  images: GeneratedImage[];
  errorCode: ErrorCode | null;
  lastIntent: AvatarIntent | null;
  run: (options: RunGenerationOptions) => Promise<void>;
  restore: (images: GeneratedImage[], intent: AvatarIntent) => void;
  reset: () => void;
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
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      requestSequence.current += 1;
      activeController.current?.abort();
      activeController.current = null;
    },
    [],
  );

  const run = useCallback(
    async ({
      intent,
      apiKey,
      buildForm,
      preserveExistingImages = false,
      onSuccess,
    }: RunGenerationOptions) => {
      // Every invocation owns the result surface, including local validation
      // failures. An older in-flight response must never overwrite it.
      activeController.current?.abort();
      activeController.current = null;
      const requestId = requestSequence.current + 1;
      requestSequence.current = requestId;
      if (!apiKey) {
        setErrorCode("MISSING_API_KEY");
        setStatus(preserveExistingImages && images.length > 0 ? "success" : "error");
        return;
      }
      // Start the new network lifecycle after local validation succeeds.
      setLastIntent(intent);
      setStatus("generating");
      setErrorCode(null);
      if (!preserveExistingImages) setImages([]);

      const controller = new AbortController();
      activeController.current = controller;
      const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          body: buildForm(intent),
          signal: controller.signal,
        });
        const data = (await res.json()) as GenerateResponse;
        if (requestSequence.current !== requestId) return;
        if (data.success && data.images) {
          setImages(data.images);
          setStatus("success");
          onSuccess?.(intent, data.images);
        } else {
          setErrorCode(data.error?.code ?? "UNKNOWN_ERROR");
          setStatus(
            preserveExistingImages && images.length > 0 ? "success" : "error",
          );
        }
      } catch (error) {
        if (requestSequence.current !== requestId) return;
        setErrorCode(
          error instanceof DOMException && error.name === "AbortError"
            ? "PROVIDER_TIMEOUT"
            : "UNKNOWN_ERROR",
        );
        setStatus(
          preserveExistingImages && images.length > 0 ? "success" : "error",
        );
      } finally {
        clearTimeout(timer);
        if (requestSequence.current === requestId) {
          activeController.current = null;
        }
      }
    },
    [images],
  );

  const restore = useCallback(
    (nextImages: GeneratedImage[], intent: AvatarIntent) => {
      setImages(nextImages);
      setLastIntent(intent);
      setErrorCode(null);
      setStatus("success");
    },
    [],
  );

  const reset = useCallback(() => {
    requestSequence.current += 1;
    activeController.current?.abort();
    activeController.current = null;
    setStatus("idle");
    setImages([]);
    setErrorCode(null);
    setLastIntent(null);
  }, []);

  return { status, images, errorCode, lastIntent, run, restore, reset };
}
