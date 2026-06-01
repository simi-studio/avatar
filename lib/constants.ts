/** Shared, non-sensitive constants for Simi Avatar. */

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Simi Avatar";

export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  "https://github.com/simi-studio/avatar";

export const GENERATION_MODES = ["single", "couple", "themed"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const PROVIDERS = ["openai", "minimax"] as const;
export type ProviderId = (typeof PROVIDERS)[number];

export const MINIMAX_REGIONS = ["global", "china"] as const;
export type MiniMaxRegion = (typeof MINIMAX_REGIONS)[number];

export const IMAGE_SIZES = ["512x512", "1024x1024"] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];
export const DEFAULT_IMAGE_SIZE: ImageSize = "1024x1024";

/** Accepted upload MIME types. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

/** Upload limits (see prd.md §6.2). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
export const MIN_IMAGE_DIMENSION = 256;
export const RECOMMENDED_IMAGE_DIMENSION = 1024;

/** Client-side request timeout for generation (ms). */
export const CLIENT_TIMEOUT_MS = 60_000;

/** Number of input images required per mode. */
export const REQUIRED_IMAGE_COUNT: Record<GenerationMode, number> = {
  single: 1,
  couple: 2,
  themed: 0,
};

/** Normalized error codes shared by client and server. */
export const ERROR_CODES = [
  "INVALID_API_KEY",
  "INSUFFICIENT_CREDITS",
  "INVALID_IMAGE",
  "IMAGE_TOO_LARGE",
  "UNSUPPORTED_FILE_TYPE",
  "INVALID_MODE_INPUT",
  "INVALID_REGION",
  "PROVIDER_TIMEOUT",
  "CONTENT_REJECTED",
  "RATE_LIMITED",
  "UNKNOWN_ERROR",
  "MISSING_API_KEY",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];
