import type {
  ErrorCode,
  GenerationMode,
  ImageSize,
  MiniMaxRegion,
  ProviderId,
} from "./constants";

export type { ErrorCode, GenerationMode, ImageSize, MiniMaxRegion, ProviderId };

export type GeneratedImage = {
  url?: string;
  base64?: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  /** "A" / "B" in couple mode. */
  label?: string;
};

export type GenerateRequestPayload = {
  provider: ProviderId;
  region?: MiniMaxRegion;
  apiKey: string;
  mode: GenerationMode;
  images?: File[];
  styleId?: string;
  themeId?: string;
  variantId?: string;
  userPrompt?: string;
  size: ImageSize;
};

export type GenerateResponse = {
  success: boolean;
  images?: GeneratedImage[];
  error?: { code: ErrorCode; message: string };
};

export type AvatarStyle = {
  id: string;
  name: string;
  description: string;
  promptTemplate: string;
};

export type AvatarVariant = {
  id: string;
  name: string;
  promptFragment: string;
};

export type AvatarTheme = {
  id: string;
  name: string;
  basePrompt: string;
  variants: AvatarVariant[];
};

/** Input passed to a provider adapter. */
export type ProviderGenerateInput = {
  apiKey: string;
  region?: MiniMaxRegion;
  mode: GenerationMode;
  images?: File[];
  prompt: string;
  negativePrompt?: string;
  referenceStrength?: number;
  styleId?: string;
  themeId?: string;
  variantId?: string;
  size: ImageSize;
};

export interface ImageProvider {
  id: ProviderId;
  name: string;
  supportedModes: GenerationMode[];
  resolveBaseUrl?(region?: MiniMaxRegion): string;
  generateAvatar(input: ProviderGenerateInput): Promise<GeneratedImage[]>;
}

/** Error carrying a normalized error code, thrown by adapters and validation. */
export class ProviderError extends Error {
  code: ErrorCode;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? code);
    this.name = "ProviderError";
    this.code = code;
  }
}
