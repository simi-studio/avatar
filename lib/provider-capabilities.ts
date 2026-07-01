import type { ImageSize, ProviderId } from "@/lib/constants";

export type ProviderCapabilities = {
  sizes: readonly ImageSize[];
  defaultSize: ImageSize;
  /**
   * Display-only model label for the cost/call-plan surface (M10.2). It must
   * track the model IDs the adapters actually send; re-verify with the drift
   * guard in docs/provider-calibration.md. Never embed a price here.
   */
  modelLabel: string;
  /**
   * Official pricing page. The app links out instead of hard-coding numbers,
   * because provider prices change and would go stale in code (D18).
   */
  pricingUrl: string;
};

export const PROVIDER_CAPABILITIES: Record<ProviderId, ProviderCapabilities> = {
  openai: {
    sizes: ["1024x1024"],
    defaultSize: "1024x1024",
    modelLabel: "gpt-image-2",
    pricingUrl: "https://openai.com/api/pricing/",
  },
  minimax: {
    sizes: ["512x512", "1024x1024"],
    defaultSize: "1024x1024",
    modelLabel: "image-01",
    pricingUrl: "https://platform.minimax.io/",
  },
  fal: {
    // FLUX square sizes: `square` (512) and `square_hd` (1024).
    sizes: ["512x512", "1024x1024"],
    defaultSize: "1024x1024",
    modelLabel: "FLUX.1 [dev]",
    pricingUrl: "https://fal.ai/pricing",
  },
};

export function sizesForProvider(provider: ProviderId): readonly ImageSize[] {
  return PROVIDER_CAPABILITIES[provider].sizes;
}

export function defaultSizeForProvider(provider: ProviderId): ImageSize {
  return PROVIDER_CAPABILITIES[provider].defaultSize;
}

export function modelLabelForProvider(provider: ProviderId): string {
  return PROVIDER_CAPABILITIES[provider].modelLabel;
}

export function pricingUrlForProvider(provider: ProviderId): string {
  return PROVIDER_CAPABILITIES[provider].pricingUrl;
}
