import type {
  GeneratedImage,
  ImageProvider,
  ProviderGenerateInput,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import type { ErrorCode, ImageSize } from "@/lib/constants";
import { isPhotoMode } from "@/lib/constants";
import { fetchWithTimeout, toGeneratedImage } from "./shared";

const OPENAI_BASE_URL = "https://api.openai.com";
const MODEL = "gpt-image-1";
const PROVIDER_TIMEOUT_MS = 55_000;

/**
 * gpt-image-1 supports 1024x1024 (and non-square variants) but not 512x512, so
 * both MVP sizes map to the smallest supported square.
 */
export function mapOpenAISize(size: ImageSize): "1024x1024" {
  void size;
  return "1024x1024";
}

type OpenAIErrorBody = {
  error?: { code?: unknown; type?: unknown; message?: unknown };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function coerceString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function readOpenAIErrorBody(body: unknown): OpenAIErrorBody {
  if (!isRecord(body) || !isRecord(body.error)) return {};
  return { error: body.error };
}

/** Map an OpenAI HTTP status + error body to a normalized error code. */
export function mapOpenAIError(
  status: number,
  body: unknown,
): ErrorCode {
  const normalized = readOpenAIErrorBody(body);
  const code = coerceString(normalized.error?.code);
  const type = coerceString(normalized.error?.type);

  if (status === 401) return "INVALID_API_KEY";
  if (code === "insufficient_quota" || code === "billing_hard_limit_reached") {
    return "INSUFFICIENT_CREDITS";
  }
  if (status === 429) return "RATE_LIMITED";
  if (
    code === "moderation_blocked" ||
    code === "content_policy_violation" ||
    type === "image_generation_user_error"
  ) {
    return "CONTENT_REJECTED";
  }
  if (status === 408 || status === 504) return "PROVIDER_TIMEOUT";
  if (status === 400) return "INVALID_IMAGE";
  return "UNKNOWN_ERROR";
}

async function parseOpenAIResponse(
  res: Response,
  label?: string,
): Promise<GeneratedImage[]> {
  if (!res.ok) {
    let body: OpenAIErrorBody = {};
    try {
      body = readOpenAIErrorBody(await res.json());
    } catch {
      // Ignore unparsable error bodies; status drives the mapping.
    }
    throw new ProviderError(mapOpenAIError(res.status, body));
  }

  const json = (await res.json()) as unknown;
  const data = isRecord(json) && Array.isArray(json.data) ? json.data : [];
  const first = data[0];
  if (!isRecord(first)) {
    throw new ProviderError("UNKNOWN_ERROR");
  }
  if (!first?.b64_json) {
    throw new ProviderError("UNKNOWN_ERROR");
  }
  return [toGeneratedImage(String(first.b64_json), "image/png", label)];
}

async function generateThemed(
  input: ProviderGenerateInput,
  label?: string,
): Promise<GeneratedImage[]> {
  const res = await fetchWithTimeout(
    `${OPENAI_BASE_URL}/v1/images/generations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: input.prompt,
        size: mapOpenAISize(input.size),
        n: 1,
      }),
    },
    PROVIDER_TIMEOUT_MS,
  );
  return parseOpenAIResponse(res, label);
}

async function editImage(
  input: ProviderGenerateInput,
  image: File,
  label?: string,
): Promise<GeneratedImage[]> {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", input.prompt);
  form.append("size", mapOpenAISize(input.size));
  form.append("n", "1");
  form.append("image", image, sanitizeFilename(image.name || "image.png"));

  const res = await fetchWithTimeout(
    `${OPENAI_BASE_URL}/v1/images/edits`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${input.apiKey}` },
      body: form,
    },
    PROVIDER_TIMEOUT_MS,
  );
  return parseOpenAIResponse(res, label);
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w.-]/g, "_") || "image.png";
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
  if (firstFailure?.status === "rejected" && firstFailure.reason instanceof ProviderError) {
    throw firstFailure.reason;
  }
  throw new ProviderError("UNKNOWN_ERROR");
}

export const openaiProvider: ImageProvider = {
  id: "openai",
  name: "OpenAI",
  supportedModes: ["text", "couple-text", "single", "couple", "themed"],

  async generateAvatar(input) {
    if (!isPhotoMode(input.mode)) {
      // couple-text: two text-to-image avatars sharing the prompt, labeled A / B.
      if (input.mode === "couple-text") {
        return collectSuccessful([
          generateThemed(input, "A"),
          generateThemed(input, "B"),
        ]);
      }
      // text / themed: pure text-to-image, no upload.
      return generateThemed(input);
    }

    const images = input.images ?? [];
    if (input.mode === "single") {
      const image = images[0];
      if (!image) throw new ProviderError("INVALID_MODE_INPUT");
      return editImage(input, image);
    }

    // couple: two edits sharing the same prompt and style, labeled A / B.
    const [a, b] = images;
    if (!a || !b) throw new ProviderError("INVALID_MODE_INPUT");
    return collectSuccessful([
      editImage(input, a, "A"),
      editImage(input, b, "B"),
    ]);
  },
};
