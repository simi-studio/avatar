import type {
  GeneratedImage,
  ImageProvider,
  ProviderGenerateInput,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import type { ErrorCode, ImageSize, MiniMaxRegion } from "@/lib/constants";
import { isPhotoMode } from "@/lib/constants";
import { fetchWithTimeout, fileToDataUrl, toGeneratedImage } from "./shared";

const MINIMAX_BASE_URL: Record<MiniMaxRegion, string> = {
  global: "https://api.minimax.io",
  china: "https://api.minimaxi.com",
};

const MODEL = "image-01";
const PROVIDER_TIMEOUT_MS = 55_000;

/** Resolve the region-specific base URL; defaults to Global. */
export function resolveMiniMaxBaseUrl(region?: MiniMaxRegion): string {
  if (region && region in MINIMAX_BASE_URL) {
    return MINIMAX_BASE_URL[region];
  }
  return MINIMAX_BASE_URL.global;
}

function sizeToDimensions(size: ImageSize): { width: number; height: number } {
  const [w, h] = size.split("x").map((n) => Number.parseInt(n, 10));
  return { width: w ?? 1024, height: h ?? 1024 };
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

async function callMiniMax(
  input: ProviderGenerateInput,
  image: File | undefined,
  label?: string,
): Promise<GeneratedImage[]> {
  const baseUrl = resolveMiniMaxBaseUrl(input.region);
  const { width, height } = sizeToDimensions(input.size);

  const body: Record<string, unknown> = {
    model: MODEL,
    prompt: input.prompt,
    width,
    height,
    n: 1,
    response_format: "base64",
  };

  if (isPhotoMode(input.mode) && image) {
    body.subject_reference = [
      { type: "character", image_file: [await fileToDataUrl(image)] },
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

  const json = (await res.json()) as MiniMaxResponse;
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

export const minimaxProvider: ImageProvider = {
  id: "minimax",
  name: "MiniMax",
  supportedModes: ["text", "couple-text", "single", "couple", "themed"],
  resolveBaseUrl: resolveMiniMaxBaseUrl,

  async generateAvatar(input) {
    if (!isPhotoMode(input.mode)) {
      // couple-text: two text-to-image avatars sharing the prompt, labeled A / B.
      if (input.mode === "couple-text") {
        const [resA, resB] = await Promise.all([
          callMiniMax(input, undefined, "A"),
          callMiniMax(input, undefined, "B"),
        ]);
        return [...resA, ...resB];
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
    const [resA, resB] = await Promise.all([
      callMiniMax(input, a, "A"),
      callMiniMax(input, b, "B"),
    ]);
    return [...resA, ...resB];
  },
};
