import type {
  GeneratedImage,
  ImageProvider,
  ProviderGenerateInput,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import type { ErrorCode, MiniMaxRegion } from "@/lib/constants";
import { isPhotoMode } from "@/lib/constants";
import {
  fetchWithTimeout,
  fileToDataUrl,
  toGeneratedImage,
  withCoupleTextPartnerPrompt,
} from "./shared";

const MINIMAX_BASE_URL: Record<MiniMaxRegion, string> = {
  global: "https://api.minimax.io",
  china: "https://api.minimaxi.com",
};

const DEFAULT_MODEL = "image-01";
const LIVE_MODEL = "image-01-live";
const PROVIDER_TIMEOUT_MS = 55_000;
const MINIMAX_ASPECT_RATIO = "1:1";
const LIVE_STYLE_IDS = new Set([
  "anime",
  "comic-book",
  "watercolor",
  "retro-game",
  "pixar-3d",
]);

/** Resolve the region-specific base URL; defaults to Global. */
export function resolveMiniMaxBaseUrl(region?: MiniMaxRegion): string {
  if (region && region in MINIMAX_BASE_URL) {
    return MINIMAX_BASE_URL[region];
  }
  return MINIMAX_BASE_URL.global;
}

function selectMiniMaxModel(input: ProviderGenerateInput): string {
  if (
    isPhotoMode(input.mode) &&
    input.styleId &&
    LIVE_STYLE_IDS.has(input.styleId)
  ) {
    return LIVE_MODEL;
  }
  return DEFAULT_MODEL;
}

/**
 * Map a MiniMax `base_resp.status_code` to a normalized error code. MiniMax
 * keys are region-bound, so auth failures are surfaced as `INVALID_REGION`
 * rather than leaking which endpoint was tried (security.md).
 */
export function mapMiniMaxStatus(statusCode: number): ErrorCode {
  switch (statusCode) {
    case 1004:
    case 2049:
      return "INVALID_REGION";
    case 1008:
      return "INSUFFICIENT_CREDITS";
    case 1002:
    case 1039:
      return "RATE_LIMITED";
    case 1027:
      return "CONTENT_REJECTED";
    default:
      return "UNKNOWN_ERROR";
  }
}

type MiniMaxResponse = {
  data?: { image_base64?: string[]; image_urls?: string[] };
  base_resp?: { status_code?: number; status_msg?: string };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMiniMaxResponse(value: unknown): MiniMaxResponse {
  if (!isRecord(value)) return {};
  const baseResp = isRecord(value.base_resp) ? value.base_resp : {};
  const data = isRecord(value.data) ? value.data : {};
  return {
    base_resp: {
      status_code:
        typeof baseResp.status_code === "number"
          ? baseResp.status_code
          : undefined,
      status_msg:
        typeof baseResp.status_msg === "string"
          ? baseResp.status_msg
          : undefined,
    },
    data: {
      image_base64: Array.isArray(data.image_base64)
        ? data.image_base64.filter(
            (item): item is string => typeof item === "string",
          )
        : undefined,
      image_urls: Array.isArray(data.image_urls)
        ? data.image_urls.filter((item): item is string => typeof item === "string")
        : undefined,
    },
  };
}

async function callMiniMax(
  input: ProviderGenerateInput,
  image: File | undefined,
  label?: string,
): Promise<GeneratedImage[]> {
  const baseUrl = resolveMiniMaxBaseUrl(input.region);

  const body: Record<string, unknown> = {
    model: selectMiniMaxModel(input),
    prompt: input.prompt,
    aspect_ratio: MINIMAX_ASPECT_RATIO,
    n: 1,
    response_format: "base64",
    prompt_optimizer: true,
  };

  if (isPhotoMode(input.mode) && image) {
    body.subject_reference = [
      { type: "character", image_file: await fileToDataUrl(image) },
    ];
  }

  const res = await fetchWithTimeout(
    `${baseUrl}/v1/image_generation`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
    PROVIDER_TIMEOUT_MS,
  );

  if (res.status === 401 || res.status === 403) {
    throw new ProviderError("INVALID_REGION");
  }
  if (!res.ok) {
    if (res.status === 429) throw new ProviderError("RATE_LIMITED");
    throw new ProviderError("UNKNOWN_ERROR");
  }

  const json = parseMiniMaxResponse(await res.json());
  const statusCode = json.base_resp?.status_code ?? 0;
  if (statusCode !== 0) {
    throw new ProviderError(mapMiniMaxStatus(statusCode));
  }

  const base64 = json.data?.image_base64?.[0];
  if (!base64) {
    throw new ProviderError("UNKNOWN_ERROR");
  }
  return [toGeneratedImage(base64, "image/png", label)];
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

export const minimaxProvider: ImageProvider = {
  id: "minimax",
  name: "MiniMax",
  supportedModes: ["text", "couple-text", "single", "couple", "themed"],
  resolveBaseUrl: resolveMiniMaxBaseUrl,

  async generateAvatar(input) {
    if (!isPhotoMode(input.mode)) {
      // couple-text: two text-to-image avatars sharing style with distinct partner guidance.
      if (input.mode === "couple-text") {
        return collectSuccessful([
          callMiniMax(withCoupleTextPartnerPrompt(input, "A"), undefined, "A"),
          callMiniMax(withCoupleTextPartnerPrompt(input, "B"), undefined, "B"),
        ]);
      }
      // text / themed: pure text-to-image, no upload.
      return callMiniMax(input, undefined);
    }

    const images = input.images ?? [];
    if (input.mode === "single") {
      const image = images[0];
      if (!image) throw new ProviderError("INVALID_MODE_INPUT");
      return callMiniMax(input, image);
    }

    // couple: two calls sharing the same prompt and style, labeled A / B.
    const [a, b] = images;
    if (!a || !b) throw new ProviderError("INVALID_MODE_INPUT");
    return collectSuccessful([
      callMiniMax(input, a, "A"),
      callMiniMax(input, b, "B"),
    ]);
  },
};
