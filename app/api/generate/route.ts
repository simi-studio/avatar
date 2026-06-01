import { NextResponse } from "next/server";

import type {
  ErrorCode,
  GenerateResponse,
  GenerationMode,
  ImageSize,
  MiniMaxRegion,
  ProviderId,
} from "@/lib/types";
import { ProviderError } from "@/lib/types";
import { DEFAULT_IMAGE_SIZE } from "@/lib/constants";
import { getProvider } from "@/lib/providers";
import { buildPrompt } from "@/lib/prompt-builder";
import { getStyleById } from "@/styles/avatar-styles";
import { getThemeById, getVariant } from "@/styles/avatar-themes";
import {
  isValidSize,
  validateImageFile,
  validateModeInput,
  validateProviderRegion,
} from "@/lib/validation";

const STATUS_BY_CODE: Partial<Record<ErrorCode, number>> = {
  MISSING_API_KEY: 400,
  INVALID_MODE_INPUT: 400,
  UNSUPPORTED_FILE_TYPE: 400,
  IMAGE_TOO_LARGE: 413,
  INVALID_IMAGE: 400,
  INVALID_API_KEY: 401,
  INVALID_REGION: 401,
  INSUFFICIENT_CREDITS: 402,
  CONTENT_REJECTED: 422,
  RATE_LIMITED: 429,
  PROVIDER_TIMEOUT: 504,
  UNKNOWN_ERROR: 502,
};

function errorResponse(code: ErrorCode): NextResponse<GenerateResponse> {
  const status = STATUS_BY_CODE[code] ?? 500;
  return NextResponse.json(
    { success: false, error: { code, message: code } },
    { status },
  );
}

type ParsedRequest = {
  provider: string;
  region?: string;
  apiKey: string;
  mode: GenerationMode;
  images: File[];
  styleId?: string;
  themeId?: string;
  variantId?: string;
  userPrompt?: string;
  size: string;
};

async function parseRequest(req: Request): Promise<ParsedRequest | null> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Record<string, unknown>;
    return {
      provider: String(body.provider ?? ""),
      region: body.region ? String(body.region) : undefined,
      apiKey: String(body.apiKey ?? ""),
      mode: String(body.mode ?? "") as GenerationMode,
      images: [],
      styleId: body.styleId ? String(body.styleId) : undefined,
      themeId: body.themeId ? String(body.themeId) : undefined,
      variantId: body.variantId ? String(body.variantId) : undefined,
      userPrompt: body.userPrompt ? String(body.userPrompt) : undefined,
      size: String(body.size ?? DEFAULT_IMAGE_SIZE),
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
      mode: (get("mode") ?? "") as GenerationMode,
      images,
      styleId: get("styleId"),
      themeId: get("themeId"),
      variantId: get("variantId"),
      userPrompt: get("userPrompt"),
      size: get("size") ?? DEFAULT_IMAGE_SIZE,
    };
  }

  return null;
}

export async function POST(req: Request): Promise<NextResponse<GenerateResponse>> {
  let parsed: ParsedRequest | null;
  try {
    parsed = await parseRequest(req);
  } catch {
    return errorResponse("UNKNOWN_ERROR");
  }
  if (!parsed) {
    return errorResponse("INVALID_MODE_INPUT");
  }

  const regionError = validateProviderRegion(parsed.provider, parsed.region);
  if (regionError) return errorResponse(regionError);

  if (!parsed.apiKey) return errorResponse("MISSING_API_KEY");

  if (!isValidSize(parsed.size)) return errorResponse("INVALID_MODE_INPUT");

  for (const image of parsed.images) {
    const imageError = validateImageFile(image);
    if (imageError) return errorResponse(imageError);
  }

  const modeError = validateModeInput({
    mode: parsed.mode,
    imageCount: parsed.images.length,
    styleId: parsed.styleId,
    themeId: parsed.themeId,
    variantId: parsed.variantId,
  });
  if (modeError) return errorResponse(modeError);

  const prompt = buildPrompt({
    mode: parsed.mode,
    style: getStyleById(parsed.styleId),
    theme: getThemeById(parsed.themeId),
    variant: getVariant(parsed.themeId, parsed.variantId),
    userPrompt: parsed.userPrompt,
  });

  const provider = getProvider(parsed.provider as ProviderId);

  try {
    const images = await provider.generateAvatar({
      apiKey: parsed.apiKey,
      region: parsed.region as MiniMaxRegion | undefined,
      mode: parsed.mode,
      images: parsed.images,
      prompt,
      styleId: parsed.styleId,
      themeId: parsed.themeId,
      variantId: parsed.variantId,
      size: parsed.size as ImageSize,
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
