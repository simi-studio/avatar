import type {
  GeneratedImage,
  ImageProvider,
  ProviderGenerateInput,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import type { ErrorCode, ImageSize } from "@/lib/constants";
import { isPhotoMode } from "@/lib/constants";
import {
  assertMime,
  fetchWithTimeout,
  fileToDataUrl,
  toGeneratedImage,
  withCoupleTextPartnerPrompt,
} from "./shared";

const FAL_BASE_URL = "https://fal.run";
const TEXT_MODEL = "fal-ai/flux/dev";
const IMAGE_MODEL = "fal-ai/flux/dev/image-to-image";
const PROVIDER_TIMEOUT_MS = 120_000;

/** Map the app's square sizes to FLUX `image_size` enum values. */
export function mapFalSize(size: ImageSize): "square_hd" | "square" {
  return size === "512x512" ? "square" : "square_hd";
}

/**
 * Map the intent reference strength (higher = closer likeness) to FLUX
 * image-to-image `strength` (higher = more transformation, less likeness).
 */
export function mapFalStrength(referenceStrength: number | undefined): number {
  const ref = referenceStrength ?? 0.65;
  return Math.min(0.95, Math.max(0.4, 0.95 - ref * 0.4));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(coerceString).join(" ");
  if (isRecord(value)) return coerceString(value.msg ?? value.detail ?? "");
  return "";
}

/** Map a fal HTTP status + error body to a normalized error code. */
export function mapFalError(status: number, body: unknown): ErrorCode {
  const detail = isRecord(body) ? coerceString(body.detail).toLowerCase() : "";

  if (status === 401 || status === 403) return "INVALID_API_KEY";
  if (status === 402 || detail.includes("balance") || detail.includes("quota")) {
    return "INSUFFICIENT_CREDITS";
  }
  if (status === 429) return "RATE_LIMITED";
  if (
    detail.includes("nsfw") ||
    detail.includes("safety") ||
    detail.includes("content policy")
  ) {
    return "CONTENT_REJECTED";
  }
  if (status === 408 || status === 504) return "PROVIDER_TIMEOUT";
  if (status === 422) return "INVALID_MODE_INPUT";
  if (status === 400) return "INVALID_IMAGE";
  return "UNKNOWN_ERROR";
}

/**
 * Only fetch generated images back from fal-controlled hosts. The result URL
 * comes from the provider response, so this guards against SSRF via a tampered
 * or unexpected payload.
 */
export function isAllowedFalImageHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return (
      hostname === "fal.media" ||
      hostname.endsWith(".fal.media") ||
      hostname.endsWith(".fal.run") ||
      hostname.endsWith(".fal.ai")
    );
  } catch {
    return false;
  }
}

type FalImage = { url?: unknown; content_type?: unknown };

async function downloadImage(
  image: FalImage,
  label?: string,
): Promise<GeneratedImage> {
  const url = typeof image.url === "string" ? image.url : "";
  if (!url || !isAllowedFalImageHost(url)) {
    throw new ProviderError("UNKNOWN_ERROR");
  }
  const res = await fetchWithTimeout(url, { method: "GET" }, PROVIDER_TIMEOUT_MS);
  if (!res.ok) throw new ProviderError("UNKNOWN_ERROR");

  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = assertMime(
    typeof image.content_type === "string"
      ? image.content_type
      : (res.headers.get("content-type") ?? undefined),
  );
  return toGeneratedImage(buffer.toString("base64"), mime, label);
}

async function parseFalResponse(
  res: Response,
  label?: string,
): Promise<GeneratedImage[]> {
  if (!res.ok) {
    let body: unknown = {};
    try {
      body = await res.json();
    } catch {
      // Ignore unparsable error bodies; status drives the mapping.
    }
    throw new ProviderError(mapFalError(res.status, body));
  }

  const json = (await res.json()) as unknown;
  const images = isRecord(json) && Array.isArray(json.images) ? json.images : [];
  const first = images[0];
  if (!isRecord(first)) throw new ProviderError("UNKNOWN_ERROR");
  return [await downloadImage(first, label)];
}

async function callFal(
  input: ProviderGenerateInput,
  body: Record<string, unknown>,
  model: string,
  label?: string,
): Promise<GeneratedImage[]> {
  const res = await fetchWithTimeout(
    `${FAL_BASE_URL}/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Key ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    PROVIDER_TIMEOUT_MS,
  );
  return parseFalResponse(res, label);
}

async function generateText(
  input: ProviderGenerateInput,
  label?: string,
): Promise<GeneratedImage[]> {
  return callFal(
    input,
    {
      prompt: input.prompt,
      image_size: mapFalSize(input.size),
      num_images: 1,
      enable_safety_checker: true,
    },
    TEXT_MODEL,
    label,
  );
}

async function generateFromImage(
  input: ProviderGenerateInput,
  image: File,
  label?: string,
): Promise<GeneratedImage[]> {
  const imageUrl = await fileToDataUrl(image);
  return callFal(
    input,
    {
      prompt: input.prompt,
      image_url: imageUrl,
      image_size: mapFalSize(input.size),
      strength: mapFalStrength(input.referenceStrength),
      num_images: 1,
      enable_safety_checker: true,
    },
    IMAGE_MODEL,
    label,
  );
}

async function collectSuccessful(
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

export const falProvider: ImageProvider = {
  id: "fal",
  name: "fal.ai",
  supportedModes: ["text", "couple-text", "single", "couple", "themed"],

  async generateAvatar(input) {
    if (!isPhotoMode(input.mode)) {
      if (input.mode === "couple-text") {
        return collectSuccessful([
          generateText(withCoupleTextPartnerPrompt(input, "A"), "A"),
          generateText(withCoupleTextPartnerPrompt(input, "B"), "B"),
        ]);
      }
      return generateText(input);
    }

    const images = input.images ?? [];
    if (input.mode === "single") {
      const image = images[0];
      if (!image) throw new ProviderError("INVALID_MODE_INPUT");
      return generateFromImage(input, image);
    }

    const [a, b] = images;
    if (!a || !b) throw new ProviderError("INVALID_MODE_INPUT");
    return collectSuccessful([
      generateFromImage(input, a, "A"),
      generateFromImage(input, b, "B"),
    ]);
  },
};
