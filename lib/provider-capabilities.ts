import type { ImageSize, ProviderId } from "@/lib/constants";

export type ProviderCapabilities = {
  sizes: readonly ImageSize[];
  defaultSize: ImageSize;
};

export const PROVIDER_CAPABILITIES: Record<ProviderId, ProviderCapabilities> = {
  openai: {
    sizes: ["1024x1024"],
    defaultSize: "1024x1024",
  },
  minimax: {
    sizes: ["512x512", "1024x1024"],
    defaultSize: "1024x1024",
  },
  fal: {
    // FLUX square sizes: `square` (512) and `square_hd` (1024).
    sizes: ["512x512", "1024x1024"],
    defaultSize: "1024x1024",
  },
};

export function sizesForProvider(provider: ProviderId): readonly ImageSize[] {
  return PROVIDER_CAPABILITIES[provider].sizes;
}

export function defaultSizeForProvider(provider: ProviderId): ImageSize {
  return PROVIDER_CAPABILITIES[provider].defaultSize;
}
