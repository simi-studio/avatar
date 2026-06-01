import type { ErrorCode, GeneratedImage } from "@/lib/types";
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

export { ProviderError };
export type { ErrorCode };
