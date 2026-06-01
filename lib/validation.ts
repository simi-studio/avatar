import {
  ACCEPTED_IMAGE_TYPES,
  GENERATION_MODES,
  IMAGE_SIZES,
  MAX_IMAGE_BYTES,
  MINIMAX_REGIONS,
  PROVIDERS,
  REQUIRED_IMAGE_COUNT,
  type ErrorCode,
  type GenerationMode,
  type ImageSize,
  type MiniMaxRegion,
  type ProviderId,
} from "@/lib/constants";

/** Returns true when the MIME type is an accepted upload type. */
export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export function isValidSize(size: string): size is ImageSize {
  return (IMAGE_SIZES as readonly string[]).includes(size);
}

export function isValidProvider(value: string): value is ProviderId {
  return (PROVIDERS as readonly string[]).includes(value);
}

export function isValidMode(value: string): value is GenerationMode {
  return (GENERATION_MODES as readonly string[]).includes(value);
}

export function isValidRegion(value: string): value is MiniMaxRegion {
  return (MINIMAX_REGIONS as readonly string[]).includes(value);
}

/**
 * Validate a single uploaded file's type and size. Returns a normalized error
 * code, or null when valid.
 */
export function validateImageFile(file: {
  type: string;
  size: number;
}): ErrorCode | null {
  if (!isAcceptedImageType(file.type)) {
    return "UNSUPPORTED_FILE_TYPE";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "IMAGE_TOO_LARGE";
  }
  if (file.size <= 0) {
    return "INVALID_IMAGE";
  }
  return null;
}

export type ModeInput = {
  mode: GenerationMode;
  imageCount: number;
  styleId?: string;
  themeId?: string;
  variantId?: string;
};

/**
 * Validate that the inputs match the selected mode (prd.md §11.1):
 * - `text` requires no image but a style (text-to-avatar, the default mode).
 * - `single` requires exactly 1 image and a style.
 * - `couple` requires exactly 2 images and a style.
 * - `themed` requires no image but a theme and variant.
 */
export function validateModeInput(input: ModeInput): ErrorCode | null {
  const required = REQUIRED_IMAGE_COUNT[input.mode];
  if (input.imageCount !== required) {
    return "INVALID_MODE_INPUT";
  }

  if (input.mode === "themed") {
    if (!input.themeId || !input.variantId) {
      return "INVALID_MODE_INPUT";
    }
    return null;
  }

  // text / single / couple all require a style.
  if (!input.styleId) {
    return "INVALID_MODE_INPUT";
  }
  return null;
}

/**
 * Validate provider/region coherence. MiniMax requires a valid region; OpenAI
 * must not carry a region.
 */
export function validateProviderRegion(
  provider: string,
  region: string | undefined,
): ErrorCode | null {
  if (!isValidProvider(provider)) {
    return "INVALID_MODE_INPUT";
  }
  if (provider === "minimax") {
    if (!region || !isValidRegion(region)) {
      return "INVALID_REGION";
    }
  }
  return null;
}
