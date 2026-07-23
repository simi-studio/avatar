import type {
  GeneratedImage,
  ImageProvider,
  ProviderGenerateInput,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import type { ErrorCode, ImageSize } from "@/lib/constants";
import { isPhotoMode } from "@/lib/constants";
import {
  coerceString,
  collectSuccessful,
  fetchWithTimeout,
  fileToDataUrl,
  isRecord,
  toGeneratedImage,
  withCoupleTextPartnerPrompt,
} from "./shared";

const XAI_BASE_URL = "https://api.x.ai";
const MODEL = "grok-imagine-image-quality";
const PROVIDER_TIMEOUT_MS = 120_000;

/**
 * Map app square sizes to Grok Imagine resolution. The app avatar flow is
 * square; xAI exposes 1k / 2k rather than pixel pairs. Capabilities only
 * advertise 1024x1024 → 1k.
 */
export function mapXaiResolution(size: ImageSize): "1k" {
  if (size !== "1024x1024") {
    throw new ProviderError("INVALID_MODE_INPUT");
  }
  return "1k";
}

type XaiErrorBody = {
  error?: { code?: unknown; type?: unknown; message?: unknown };
};

type XaiImageItem = {
  b64_json?: unknown;
  url?: unknown;
  mime_type?: unknown;
};

function readXaiErrorBody(body: unknown): XaiErrorBody {
  if (!isRecord(body) || !isRecord(body.error)) return {};
  return { error: body.error };
}

/** Map an xAI HTTP status + error body to a normalized error code. */
export function mapXaiError(status: number, body: unknown): ErrorCode {
  const normalized = readXaiErrorBody(body);
  const code = coerceString(normalized.error?.code).toLowerCase();
  const type = coerceString(normalized.error?.type).toLowerCase();
  const message = coerceString(normalized.error?.message).toLowerCase();
  const combined = `${code} ${type} ${message}`;

  if (
    status === 402 ||
    code === "insufficient_quota" ||
    code === "billing_hard_limit_reached" ||
    combined.includes("insufficient") ||
    combined.includes("quota") ||
    combined.includes("balance") ||
    combined.includes("credit")
  ) {
    return "INSUFFICIENT_CREDITS";
  }
  if (
    code === "moderation_blocked" ||
    code === "content_policy_violation" ||
    combined.includes("moderation") ||
    combined.includes("content policy") ||
    combined.includes("safety") ||
    combined.includes("nsfw")
  ) {
    return "CONTENT_REJECTED";
  }
  if (status === 401 || status === 403) return "INVALID_API_KEY";
  if (status === 429) return "RATE_LIMITED";
  if (status === 408 || status === 504) return "PROVIDER_TIMEOUT";
  // 400/422 can be bad params, model errors, or bad images — do not assume
  // every failure is an invalid upload (text modes never send an image).
  if (
    combined.includes("image") ||
    combined.includes("media") ||
    combined.includes("upload") ||
    combined.includes("file")
  ) {
    return "INVALID_IMAGE";
  }
  if (status === 400 || status === 422) return "INVALID_MODE_INPUT";
  return "UNKNOWN_ERROR";
}

/**
 * Only follow temporary result URLs hosted by xAI-controlled hosts.
 * Guards against SSRF if a response payload is tampered with.
 */
export function isAllowedXaiImageHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    return (
      hostname === "x.ai" ||
      hostname.endsWith(".x.ai") ||
      // Observed temporary media hosts used by xAI / Grok Imagine APIs.
      hostname.endsWith(".grok.x.ai") ||
      hostname === "imgen.x.ai"
    );
  } catch {
    return false;
  }
}

/** Prefer the API-provided mime type; fall back to magic-byte sniffing. */
export function resolveXaiMime(
  declared: unknown,
  base64?: string,
): GeneratedImage["mimeType"] {
  if (typeof declared === "string" && declared.length > 0) {
    const normalized = declared.split(";")[0]?.trim().toLowerCase();
    if (normalized === "image/jpg") return "image/jpeg";
    if (
      normalized === "image/jpeg" ||
      normalized === "image/png" ||
      normalized === "image/webp"
    ) {
      return normalized;
    }
  }
  if (base64) {
    try {
      const head = Buffer.from(base64.slice(0, 32), "base64");
      if (head[0] === 0xff && head[1] === 0xd8) return "image/jpeg";
      if (
        head[0] === 0x89 &&
        head[1] === 0x50 &&
        head[2] === 0x4e &&
        head[3] === 0x47
      ) {
        return "image/png";
      }
      if (
        head[0] === 0x52 &&
        head[1] === 0x49 &&
        head[2] === 0x46 &&
        head[3] === 0x46
      ) {
        return "image/webp";
      }
    } catch {
      // Fall through to default.
    }
  }
  return "image/jpeg";
}

async function downloadXaiImage(
  url: string,
  mimeHint: unknown,
  label?: string,
): Promise<GeneratedImage> {
  if (!isAllowedXaiImageHost(url)) {
    throw new ProviderError("UNKNOWN_ERROR");
  }
  const res = await fetchWithTimeout(
    url,
    { method: "GET", redirect: "manual" },
    PROVIDER_TIMEOUT_MS,
  );
  if (!res.ok) throw new ProviderError("UNKNOWN_ERROR");
  const buffer = Buffer.from(await res.arrayBuffer());
  const mime = resolveXaiMime(
    typeof mimeHint === "string" ? mimeHint : res.headers.get("content-type"),
    buffer.toString("base64").slice(0, 48),
  );
  return toGeneratedImage(buffer.toString("base64"), mime, label);
}

async function parseXaiResponse(
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
    throw new ProviderError(mapXaiError(res.status, body));
  }

  const json = (await res.json()) as unknown;
  const data = isRecord(json) && Array.isArray(json.data) ? json.data : [];
  const first = data[0];
  if (!isRecord(first)) {
    throw new ProviderError("UNKNOWN_ERROR");
  }

  const item = first as XaiImageItem;

  // Prefer base64 (no extra network hop / tighter SSRF surface).
  if (typeof item.b64_json === "string" && item.b64_json.length > 0) {
    const mime = resolveXaiMime(item.mime_type, item.b64_json);
    return [toGeneratedImage(item.b64_json, mime, label)];
  }

  // Fall back to temporary result URLs from xAI-controlled hosts only.
  if (typeof item.url === "string" && item.url.length > 0) {
    return [await downloadXaiImage(item.url, item.mime_type, label)];
  }

  throw new ProviderError("UNKNOWN_ERROR");
}

async function generateText(
  input: ProviderGenerateInput,
  label?: string,
): Promise<GeneratedImage[]> {
  const res = await fetchWithTimeout(
    `${XAI_BASE_URL}/v1/images/generations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: input.prompt,
        n: 1,
        aspect_ratio: "1:1",
        resolution: mapXaiResolution(input.size),
        response_format: "b64_json",
      }),
    },
    PROVIDER_TIMEOUT_MS,
  );
  return parseXaiResponse(res, label);
}

/**
 * xAI image edits use JSON (`application/json`) with a data URI or public URL
 * — not OpenAI-style multipart form data. Match the documented shape used by
 * community adapters: `{ image: { url } }` (optional `type` is omitted).
 */
async function editImage(
  input: ProviderGenerateInput,
  image: File,
  label?: string,
): Promise<GeneratedImage[]> {
  const imageUrl = await fileToDataUrl(image);
  const res = await fetchWithTimeout(
    `${XAI_BASE_URL}/v1/images/edits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: input.prompt,
        n: 1,
        // Single-image edits keep the source aspect; still request square 1k
        // for avatar-sized output when the API honors it.
        aspect_ratio: "1:1",
        resolution: mapXaiResolution(input.size),
        response_format: "b64_json",
        image: { url: imageUrl },
      }),
    },
    PROVIDER_TIMEOUT_MS,
  );
  return parseXaiResponse(res, label);
}

export const xaiProvider: ImageProvider = {
  id: "xai",
  name: "xAI",
  supportedModes: ["text", "couple-text", "single", "couple", "themed"],

  async generateAvatar(input) {
    if (!isPhotoMode(input.mode)) {
      if (input.mode === "couple-text") {
        if (input.sameFrame) return generateText(input);
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
      return editImage(input, image);
    }

    const [a, b] = images;
    if (!a || !b) throw new ProviderError("INVALID_MODE_INPUT");
    return collectSuccessful([
      editImage(input, a, "A"),
      editImage(input, b, "B"),
    ]);
  },
};
