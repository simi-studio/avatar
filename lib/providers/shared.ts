import type { ErrorCode, GeneratedImage, ProviderGenerateInput } from "@/lib/types";
import { ProviderError } from "@/lib/types";

/** Convert a File to a base64 string (no data-URL prefix). Server-side safe. */
export async function fileToBase64(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}

/** Convert a File to a data URL (e.g. for providers expecting inline images). */
export async function fileToDataUrl(file: File): Promise<string> {
  const base64 = await fileToBase64(file);
  return `data:${file.type};base64,${base64}`;
}

export function assertMime(
  type: string | undefined,
): "image/png" | "image/jpeg" | "image/webp" {
  if (type === "image/jpeg" || type === "image/webp") return type;
  return "image/png";
}

/**
 * Perform a fetch with an abort-based timeout, mapping aborts to
 * `PROVIDER_TIMEOUT`.
 */
export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ProviderError("PROVIDER_TIMEOUT");
    }
    throw new ProviderError("UNKNOWN_ERROR");
  } finally {
    clearTimeout(timer);
  }
}

export function toGeneratedImage(
  base64: string,
  mimeType: GeneratedImage["mimeType"],
  label?: string,
): GeneratedImage {
  return { base64, mimeType, label };
}

/** Narrow an unknown value to a plain object (not an array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Best-effort coercion of an unknown provider error payload to a string.
 * Handles primitives, arrays, and nested `{ msg | detail }` shapes so a single
 * helper serves every adapter's error mapping.
 */
export function coerceString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) return value.map(coerceString).join(" ");
  if (isRecord(value)) return coerceString(value.msg ?? value.detail ?? "");
  return "";
}

/**
 * Run provider calls and return every successful image. When all calls fail,
 * rethrow the first `ProviderError` so the route maps a meaningful code instead
 * of a generic failure.
 */
export async function collectSuccessful(
  calls: Array<Promise<GeneratedImage[]>>,
): Promise<GeneratedImage[]> {
  const results = await Promise.allSettled(calls);
  const images = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  if (images.length > 0) return images;

  const firstFailure = results.find((result) => result.status === "rejected");
  if (
    firstFailure?.status === "rejected" &&
    firstFailure.reason instanceof ProviderError
  ) {
    throw firstFailure.reason;
  }
  throw new ProviderError("UNKNOWN_ERROR");
}

export function withCoupleTextPartnerPrompt(
  input: ProviderGenerateInput,
  label: "A" | "B",
): ProviderGenerateInput {
  const partnerGuidance =
    label === "A"
      ? "Partner A: male-presenting partner by default unless the user explicitly describes a different couple, visually distinct from Partner B."
      : "Partner B: female-presenting partner by default unless the user explicitly describes a different couple, visually distinct from Partner A.";
  return {
    ...input,
    prompt: `${input.prompt}. ${partnerGuidance}`,
  };
}

export { ProviderError };
export type { ErrorCode };
