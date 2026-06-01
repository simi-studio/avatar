import type {
  GeneratedImage,
  ImageProvider,
  ProviderGenerateInput,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import type { ErrorCode, ImageSize } from "@/lib/constants";
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
  error?: { code?: string | null; type?: string | null; message?: string };
};

/** Map an OpenAI HTTP status + error body to a normalized error code. */
export function mapOpenAIError(status: number, body: OpenAIErrorBody): ErrorCode {
  const code = body.error?.code ?? "";
  const type = body.error?.type ?? "";

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

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
};

async function parseOpenAIResponse(
  res: Response,
  label?: string,
): Promise<GeneratedImage[]> {
  if (!res.ok) {
    let body: OpenAIErrorBody = {};
    try {
      body = (await res.json()) as OpenAIErrorBody;
    } catch {
      // Ignore unparsable error bodies; status drives the mapping.
    }
    throw new ProviderError(mapOpenAIError(res.status, body));
  }

  const json = (await res.json()) as OpenAIImageResponse;
  const first = json.data?.[0];
  if (!first?.b64_json) {
    throw new ProviderError("UNKNOWN_ERROR");
  }
  return [toGeneratedImage(first.b64_json, "image/png", label)];
}

async function generateThemed(
  input: ProviderGenerateInput,
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
  return parseOpenAIResponse(res);
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
  form.append("image", image, image.name || "image.png");

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

export const openaiProvider: ImageProvider = {
  id: "openai",
  name: "OpenAI",
  supportedModes: ["single", "couple", "themed"],

  async generateAvatar(input) {
    if (input.mode === "themed") {
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
    const [resA, resB] = await Promise.all([
      editImage(input, a, "A"),
      editImage(input, b, "B"),
    ]);
    return [...resA, ...resB];
  },
};
