import { NextResponse } from "next/server";

import type {
  ErrorCode,
  GenerateResponse,
  ImageSize,
  MiniMaxRegion,
  ProviderId,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import { DEFAULT_IMAGE_SIZE, MAX_GENERATE_REQUEST_BYTES } from "@/lib/constants";
import { getProvider } from "@/lib/providers";
import {
  createAvatarIntent,
  normalizeAvatarIntent,
  parseAvatarIntentJson,
} from "@/lib/avatar-intent";
import { normalizeEditIntent } from "@/lib/edit-intent";
import {
  compileAvatarPrompt,
  compileEditPrompt,
} from "@/lib/prompt-compiler";
import { capabilitiesForProvider } from "@/lib/provider-capabilities";
import {
  canAcceptMultiReference,
  canAcceptSameFrameComposite,
  compileReferenceRoleGuidance,
  defaultSinglePersonReferenceRoles,
} from "@/lib/reference-intake";
import {
  checkRateLimit,
  clientIdentifier,
  configuredLimit,
  type RateLimitState,
} from "@/lib/rate-limit";
import { getStyleById } from "@/styles/avatar-styles";
import { getThemeById, getVariant } from "@/styles/avatar-themes";
import {
  isValidSize,
  isValidMode,
  validateImageFile,
  validateImageFileContent,
  validateModeInput,
  validateProviderRegion,
  validateProviderSize,
} from "@/lib/validation";
import { stripImageMetadata } from "@/lib/server-image-safety";
import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/turnstile";

const STATUS_BY_CODE: Partial<Record<ErrorCode, number>> = {
  MISSING_API_KEY: 400,
  INVALID_MODE_INPUT: 400,
  UNSUPPORTED_FILE_TYPE: 400,
  IMAGE_TOO_LARGE: 413,
  INVALID_IMAGE: 400,
  INVALID_API_KEY: 401,
  INVALID_REGION: 401,
  INSUFFICIENT_CREDITS: 400,
  CONTENT_REJECTED: 422,
  RATE_LIMITED: 429,
  UNSUPPORTED_MEDIA_TYPE: 415,
  FORBIDDEN: 403,
  CHALLENGE_FAILED: 403,
  PROVIDER_TIMEOUT: 504,
  UNKNOWN_ERROR: 502,
};

const MESSAGE_BY_CODE: Record<ErrorCode, string> = {
  MISSING_API_KEY: "API key is required.",
  INVALID_MODE_INPUT: "The inputs do not match the selected mode.",
  UNSUPPORTED_FILE_TYPE: "Unsupported file type.",
  IMAGE_TOO_LARGE: "The image or request body is too large.",
  INVALID_IMAGE: "The uploaded image could not be read.",
  INVALID_API_KEY: "The provider rejected the API key.",
  INVALID_REGION: "The MiniMax key does not match the selected region.",
  INSUFFICIENT_CREDITS: "The provider account is out of credits or quota.",
  CONTENT_REJECTED: "The provider rejected the content.",
  RATE_LIMITED: "Too many requests.",
  UNSUPPORTED_MEDIA_TYPE: "Unsupported request media type.",
  FORBIDDEN: "The request origin is not allowed.",
  CHALLENGE_FAILED: "The verification challenge failed. Please retry.",
  PROVIDER_TIMEOUT: "The provider timed out.",
  UNKNOWN_ERROR: "Unexpected generation error.",
};

function errorResponse(
  code: ErrorCode,
  statusOverride?: number,
): NextResponse<GenerateResponse> {
  const status = statusOverride ?? STATUS_BY_CODE[code] ?? 500;
  return NextResponse.json(
    { success: false, error: { code, message: MESSAGE_BY_CODE[code] } },
    { status },
  );
}

// Instance-local rate-limit state for the optional public demo guard.
const rateLimitState: RateLimitState = new Map();

type ParsedRequest = {
  provider: string;
  region?: string;
  apiKey: string;
  mode: string;
  images: File[];
  styleId?: string;
  themeId?: string;
  variantId?: string;
  userPrompt?: string;
  pairedConsistency?: boolean;
  size: string;
  intentRaw?: unknown;
  intentJson?: string;
  operation: "generate" | "edit" | "invalid";
  editIntentRaw?: unknown;
  editIntentJson?: string;
  turnstileToken?: string;
};

function parseOperation(value: unknown): ParsedRequest["operation"] {
  if (value === undefined || value === null || value === "") return "generate";
  if (value === "generate" || value === "edit") return value;
  return "invalid";
}

async function parseRequest(
  req: Request,
): Promise<ParsedRequest | "unsupported-media-type"> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    return {
      provider: String(body.provider ?? ""),
      region: body.region ? String(body.region) : undefined,
      apiKey: String(body.apiKey ?? ""),
      mode: String(body.mode ?? ""),
      images: [],
      styleId: body.styleId ? String(body.styleId) : undefined,
      themeId: body.themeId ? String(body.themeId) : undefined,
      variantId: body.variantId ? String(body.variantId) : undefined,
      userPrompt: body.userPrompt ? String(body.userPrompt) : undefined,
      pairedConsistency: body.pairedConsistency === true,
      size: String(body.size ?? DEFAULT_IMAGE_SIZE),
      intentRaw: body.intent,
      operation: parseOperation(body.operation),
      editIntentRaw: body.editIntent,
      turnstileToken: body.turnstileToken
        ? String(body.turnstileToken)
        : undefined,
    };
  }

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const images = form
      .getAll("images")
      .filter((value): value is File => value instanceof File);
    const get = (key: string) => {
      const value = form.get(key);
      return typeof value === "string" && value.length > 0 ? value : undefined;
    };
    return {
      provider: get("provider") ?? "",
      region: get("region"),
      apiKey: get("apiKey") ?? "",
      mode: get("mode") ?? "",
      images,
      styleId: get("styleId"),
      themeId: get("themeId"),
      variantId: get("variantId"),
      userPrompt: get("userPrompt"),
      pairedConsistency: get("pairedConsistency") === "true",
      size: get("size") ?? DEFAULT_IMAGE_SIZE,
      intentJson: get("intent"),
      operation: parseOperation(get("operation")),
      editIntentJson: get("editIntent"),
      turnstileToken: get("turnstileToken"),
    };
  }

  return "unsupported-media-type";
}

function headerExceedsRequestSizeLimit(headers: Headers): boolean {
  const raw = headers.get("content-length");
  if (!raw) return false;
  const contentLength = Number.parseInt(raw, 10);
  return (
    Number.isFinite(contentLength) &&
    contentLength > MAX_GENERATE_REQUEST_BYTES
  );
}

async function enforceRequestSizeLimit(
  req: Request,
): Promise<Request | "image-too-large"> {
  // Fast-reject an honest oversized header, then always count the streamed body:
  // the `content-length` header is client-controlled and may understate the body.
  if (headerExceedsRequestSizeLimit(req.headers)) {
    return "image-too-large";
  }

  if (!req.body) return req;

  const reader = req.body.getReader();
  const chunks: ArrayBuffer[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_GENERATE_REQUEST_BYTES) {
      await reader.cancel();
      return "image-too-large";
    }
    const chunk = new Uint8Array(value.byteLength);
    chunk.set(value);
    chunks.push(chunk.buffer);
  }

  // Drop the original content-length: it is recomputed from the rebuilt body,
  // and a stale value would mismatch the Blob and fail downstream parsing.
  const headers = new Headers(req.headers);
  headers.delete("content-length");
  return new Request(req.url, {
    method: req.method,
    headers,
    body: new Blob(chunks),
    signal: req.signal,
  });
}

function configuredAllowedOrigins(): Set<string> {
  return new Set(
    (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  if (configuredAllowedOrigins().has(origin)) return true;

  const host = req.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(
  req: Request,
): Promise<NextResponse<GenerateResponse>> {
  if (!isAllowedOrigin(req)) {
    return errorResponse("FORBIDDEN");
  }

  let sizedReq: Request | "image-too-large";
  try {
    sizedReq = await enforceRequestSizeLimit(req);
  } catch {
    return errorResponse("UNKNOWN_ERROR");
  }
  if (sizedReq === "image-too-large") {
    return errorResponse("IMAGE_TOO_LARGE");
  }

  const limit = configuredLimit();
  if (limit > 0) {
    const { allowed, retryAfterSeconds } = checkRateLimit(
      rateLimitState,
      clientIdentifier(req.headers),
      limit,
    );
    if (!allowed) {
      const response = errorResponse("RATE_LIMITED");
      response.headers.set("Retry-After", String(retryAfterSeconds));
      return response;
    }
  }

  let parsed: ParsedRequest | "unsupported-media-type";
  try {
    parsed = await parseRequest(sizedReq);
  } catch {
    return errorResponse("UNKNOWN_ERROR");
  }
  if (parsed === "unsupported-media-type") {
    return errorResponse("UNSUPPORTED_MEDIA_TYPE");
  }

  // Optional public-demo challenge: when enabled, verify before any provider
  // call or image content work. Disabled (no secret) skips this entirely.
  if (isTurnstileEnabled()) {
    const passed = await verifyTurnstileToken(parsed.turnstileToken);
    if (!passed) return errorResponse("CHALLENGE_FAILED");
  }

  if (!isValidMode(parsed.mode)) return errorResponse("INVALID_MODE_INPUT");
  if (parsed.operation === "invalid") {
    return errorResponse("INVALID_MODE_INPUT");
  }

  const regionError = validateProviderRegion(parsed.provider, parsed.region);
  if (regionError) return errorResponse(regionError);

  if (!parsed.apiKey) return errorResponse("MISSING_API_KEY");

  if (!isValidSize(parsed.size)) return errorResponse("INVALID_MODE_INPUT");
  const sizeError = validateProviderSize(parsed.provider, parsed.size);
  if (sizeError) return errorResponse(sizeError);

  const safeImages: File[] = [];
  for (const image of parsed.images) {
    const imageError = validateImageFile(image);
    if (imageError) return errorResponse(imageError);
    const contentError = await validateImageFileContent(image);
    if (contentError) return errorResponse(contentError);
    safeImages.push(await stripImageMetadata(image));
  }

  const fallbackIntent = createAvatarIntent({
    mode: parsed.mode,
    styleId: parsed.styleId,
    themeId: parsed.themeId,
    variantId: parsed.variantId,
    subjectDescription: parsed.userPrompt,
    pairedConsistency: parsed.pairedConsistency,
    size: parsed.size as ImageSize,
  });
  const intent = parsed.intentRaw
    ? normalizeAvatarIntent(parsed.intentRaw, fallbackIntent)
    : parseAvatarIntentJson(parsed.intentJson, fallbackIntent);

  const providerCapabilities = capabilitiesForProvider(
    parsed.provider as ProviderId,
  );
  const multiReferenceEnabled = canAcceptMultiReference(providerCapabilities);
  const sameFrameCompositeEnabled = canAcceptSameFrameComposite(
    providerCapabilities,
  );

  // Refuse multi-image single requests until multi-reference is capability-true.
  if (
    parsed.mode === "single" &&
    safeImages.length > 1 &&
    !multiReferenceEnabled
  ) {
    return errorResponse("INVALID_MODE_INPUT");
  }

  let executionIntent = intent;
  // Photo couple same-frame falls back to A/B until composite is verified.
  if (
    executionIntent.mode === "couple" &&
    executionIntent.sameFrame &&
    !sameFrameCompositeEnabled
  ) {
    executionIntent = createAvatarIntent({
      ...executionIntent,
      sameFrame: false,
    });
  }

  let editIntentForCompile: ReturnType<typeof normalizeEditIntent> = null;
  if (parsed.operation === "edit") {
    const rawEditIntent = parsed.editIntentRaw
      ? parsed.editIntentRaw
      : (() => {
          try {
            return parsed.editIntentJson
              ? (JSON.parse(parsed.editIntentJson) as unknown)
              : undefined;
          } catch {
            return undefined;
          }
        })();
    editIntentForCompile = normalizeEditIntent(rawEditIntent);
    if (
      !providerCapabilities.supportsImageEdit ||
      safeImages.length !== 1 ||
      !editIntentForCompile
    ) {
      return errorResponse("INVALID_MODE_INPUT");
    }
    // Keep mode/style metadata for validation and adapters, but compile a
    // dedicated edit prompt (not a full generate-style redesign prompt).
    executionIntent = createAvatarIntent({
      ...intent,
      mode: "single",
      likeness: "high",
      creativity: "low",
    });
  }

  const modeError = validateModeInput({
    mode: executionIntent.mode,
    imageCount: safeImages.length,
    styleId: executionIntent.styleId,
    themeId: executionIntent.themeId,
    variantId: executionIntent.variantId,
    multiReferenceEnabled,
    maxReferenceImages: providerCapabilities.maxReferenceImages,
    sameFrameComposite: sameFrameCompositeEnabled,
  });
  if (modeError) return errorResponse(modeError);

  const provider = getProvider(parsed.provider as ProviderId);
  const style = getStyleById(executionIntent.styleId);
  const theme = getThemeById(executionIntent.themeId);
  const variant = getVariant(
    executionIntent.themeId,
    executionIntent.variantId,
  );
  if (executionIntent.mode === "themed") {
    if (!theme || !variant) return errorResponse("INVALID_MODE_INPUT");
  } else if (!style) {
    return errorResponse("INVALID_MODE_INPUT");
  }

  const referenceGuidance =
    parsed.operation !== "edit" &&
    executionIntent.mode === "single" &&
    multiReferenceEnabled &&
    safeImages.length > 1
      ? compileReferenceRoleGuidance(
          defaultSinglePersonReferenceRoles(safeImages.length),
        )
      : undefined;

  const compiled =
    parsed.operation === "edit" && editIntentForCompile
      ? compileEditPrompt({
          provider: parsed.provider as ProviderId,
          editIntent: editIntentForCompile,
        })
      : compileAvatarPrompt({
          provider: parsed.provider as ProviderId,
          intent: executionIntent,
          style,
          theme,
          variant,
          referenceGuidance,
        });

  try {
    const images = await provider.generateAvatar({
      apiKey: parsed.apiKey,
      region: parsed.region as MiniMaxRegion | undefined,
      mode: executionIntent.mode,
      images: safeImages,
      prompt: compiled.prompt,
      negativePrompt: compiled.negativePrompt,
      referenceStrength: compiled.referenceStrength,
      sameFrame: executionIntent.sameFrame,
      styleId: executionIntent.styleId,
      themeId: executionIntent.themeId,
      variantId: executionIntent.variantId,
      size: executionIntent.size,
    });
    return NextResponse.json({ success: true, images });
  } catch (error) {
    if (error instanceof ProviderError) {
      return errorResponse(error.code);
    }
    // Never surface raw provider errors (may echo request data); normalize.
    return errorResponse("UNKNOWN_ERROR");
  }
}
