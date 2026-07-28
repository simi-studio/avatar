import { PROVIDERS, type ImageSize, type ProviderId } from "@/lib/constants";

export type EditStrategy = "conversation" | "image-edit" | "regenerate";
export type IdentityPreservation =
  | "none"
  | "single-reference"
  | "multi-reference";

/**
 * Product-usable provider capabilities.
 *
 * A documented upstream feature remains false here until the current adapter,
 * validation, UI, and quality evidence can all support the same claim.
 */
export type ProviderCapabilitiesV2 = {
  sizes: readonly ImageSize[];
  defaultSize: ImageSize;
  aspectRatios: readonly string[];
  maxCandidatesPerCall: number;
  maxReferenceImages: number;
  maxReferencePeople: number;
  supportsImageEdit: boolean;
  supportsMultiTurnEdit: boolean;
  supportsMasks: boolean;
  supportsMultiImageComposite: boolean;
  supportsTransparentBackground: boolean;
  supportsSeed: boolean;
  identityPreservation: IdentityPreservation;
  editStrategy: EditStrategy;
  /**
   * Display-only model label for the cost/call-plan surface (M10.2). It must
   * track the model IDs the adapters actually send; re-verify with the drift
   * guard in docs/provider-calibration.md. Never embed a price here.
   */
  modelLabel: string;
  /** Exact immutable provider version when the adapter pins one. */
  modelVersion?: string;
  /**
   * Official pricing page. The app links out instead of hard-coding numbers,
   * because provider prices change and would go stale in code (D18).
   */
  pricingUrl: string;
  /**
   * Date on which official documentation and the current adapter contract
   * were last reconciled. Quality-sensitive claims still require an 11.1
   * fixture run before their corresponding flag can become true.
   */
  verifiedAt: string;
  documentationUrl: string;
};

export const PROVIDER_CAPABILITIES: Record<
  ProviderId,
  ProviderCapabilitiesV2
> = {
  openai: {
    sizes: ["1024x1024"],
    defaultSize: "1024x1024",
    aspectRatios: ["1:1"],
    maxCandidatesPerCall: 1,
    maxReferenceImages: 1,
    maxReferencePeople: 1,
    supportsImageEdit: true,
    supportsMultiTurnEdit: false,
    supportsMasks: false,
    supportsMultiImageComposite: false,
    supportsTransparentBackground: false,
    supportsSeed: false,
    identityPreservation: "none",
    editStrategy: "image-edit",
    modelLabel: "gpt-image-2",
    pricingUrl: "https://openai.com/api/pricing/",
    verifiedAt: "2026-07-27",
    documentationUrl:
      "https://developers.openai.com/api/docs/models/gpt-image-2",
  },
  minimax: {
    sizes: ["512x512", "1024x1024"],
    defaultSize: "1024x1024",
    aspectRatios: ["1:1"],
    maxCandidatesPerCall: 1,
    maxReferenceImages: 1,
    maxReferencePeople: 1,
    supportsImageEdit: true,
    supportsMultiTurnEdit: false,
    supportsMasks: false,
    supportsMultiImageComposite: false,
    supportsTransparentBackground: false,
    supportsSeed: false,
    identityPreservation: "none",
    editStrategy: "image-edit",
    modelLabel: "image-01",
    pricingUrl: "https://platform.minimax.io/",
    verifiedAt: "2026-07-27",
    documentationUrl:
      "https://platform.minimax.io/docs/api-reference/image-generation-i2i",
  },
  fal: {
    // FLUX square sizes: `square` (512) and `square_hd` (1024).
    sizes: ["512x512", "1024x1024"],
    defaultSize: "1024x1024",
    aspectRatios: ["1:1"],
    maxCandidatesPerCall: 1,
    maxReferenceImages: 1,
    maxReferencePeople: 1,
    supportsImageEdit: true,
    supportsMultiTurnEdit: false,
    supportsMasks: false,
    supportsMultiImageComposite: false,
    supportsTransparentBackground: false,
    // The upstream model documents a seed, but the current adapter does not
    // expose it. Product capability remains false until execution is wired.
    supportsSeed: false,
    identityPreservation: "none",
    editStrategy: "image-edit",
    modelLabel: "FLUX.1 [dev]",
    pricingUrl: "https://fal.ai/pricing",
    verifiedAt: "2026-07-27",
    documentationUrl:
      "https://fal.ai/models/fal-ai/flux/dev/image-to-image/api",
  },
  xai: {
    // Grok Imagine resolves square avatars at 1k (≈1024); 2k is not exposed yet.
    sizes: ["1024x1024"],
    defaultSize: "1024x1024",
    aspectRatios: ["1:1"],
    maxCandidatesPerCall: 1,
    maxReferenceImages: 1,
    maxReferencePeople: 1,
    supportsImageEdit: true,
    supportsMultiTurnEdit: false,
    supportsMasks: false,
    // Upstream documents up to three images, but the current adapter accepts
    // one. Keep composite disabled until adapter support and 11.1 evidence land.
    supportsMultiImageComposite: false,
    supportsTransparentBackground: false,
    supportsSeed: false,
    identityPreservation: "none",
    editStrategy: "image-edit",
    modelLabel: "grok-imagine-image-quality",
    pricingUrl: "https://docs.x.ai/developers/models",
    verifiedAt: "2026-07-27",
    documentationUrl:
      "https://docs.x.ai/developers/rest-api-reference/inference/images",
  },
};

export function capabilitiesForProvider(
  provider: ProviderId,
): ProviderCapabilitiesV2 {
  return PROVIDER_CAPABILITIES[provider];
}

export function sizesForProvider(provider: ProviderId): readonly ImageSize[] {
  return capabilitiesForProvider(provider).sizes;
}

export function defaultSizeForProvider(provider: ProviderId): ImageSize {
  return capabilitiesForProvider(provider).defaultSize;
}

export function modelLabelForProvider(provider: ProviderId): string {
  return capabilitiesForProvider(provider).modelLabel;
}

export function pricingUrlForProvider(provider: ProviderId): string {
  return capabilitiesForProvider(provider).pricingUrl;
}

export type EditExecutionContext = {
  hasSelectedImageInput: boolean;
  hasContinuation: boolean;
};

function preferredEditStrategy(
  capabilities: ProviderCapabilitiesV2,
): EditStrategy {
  if (capabilities.supportsMultiTurnEdit) return "conversation";
  if (capabilities.supportsImageEdit) return "image-edit";
  return "regenerate";
}

export function resolveEditStrategy(
  provider: ProviderId,
  context: EditExecutionContext,
): EditStrategy {
  const capabilities = capabilitiesForProvider(provider);
  if (capabilities.supportsMultiTurnEdit && context.hasContinuation) {
    return "conversation";
  }
  if (capabilities.supportsImageEdit && context.hasSelectedImageInput) {
    return "image-edit";
  }
  return "regenerate";
}

export function supportsReferenceRequest(
  provider: ProviderId,
  imageCount: number,
  personCount: number,
): boolean {
  const capabilities = capabilitiesForProvider(provider);
  return (
    imageCount >= 1 &&
    personCount >= 1 &&
    imageCount <= capabilities.maxReferenceImages &&
    personCount <= capabilities.maxReferencePeople
  );
}

export function isCapabilityVerificationStale(
  provider: ProviderId,
  asOf: Date = new Date(),
  maxAgeDays = 90,
): boolean {
  const verifiedAt = new Date(
    `${capabilitiesForProvider(provider).verifiedAt}T00:00:00.000Z`,
  );
  if (Number.isNaN(verifiedAt.getTime())) return true;
  const ageMs = asOf.getTime() - verifiedAt.getTime();
  return ageMs > maxAgeDays * 24 * 60 * 60 * 1000;
}

/** Registry invariants shared by tests and release-time drift checks. */
export function capabilityRegistryErrors(): string[] {
  const errors: string[] = [];
  for (const provider of PROVIDERS) {
    const capabilities = PROVIDER_CAPABILITIES[provider];
    if (!capabilities.sizes.includes(capabilities.defaultSize)) {
      errors.push(`${provider}: default size is not supported.`);
    }
    if (capabilities.aspectRatios.length === 0) {
      errors.push(`${provider}: at least one aspect ratio is required.`);
    }
    if (
      capabilities.maxCandidatesPerCall < 1 ||
      capabilities.maxReferenceImages < 0 ||
      capabilities.maxReferencePeople < 0
    ) {
      errors.push(`${provider}: capability limits must be non-negative.`);
    }
    if (
      capabilities.supportsMultiImageComposite &&
      (capabilities.maxReferenceImages < 2 ||
        capabilities.maxReferencePeople < 2)
    ) {
      errors.push(`${provider}: composite support requires two references and people.`);
    }
    if (
      capabilities.identityPreservation === "multi-reference" &&
      capabilities.maxReferenceImages < 2
    ) {
      errors.push(`${provider}: multi-reference identity requires two references.`);
    }
    if (preferredEditStrategy(capabilities) !== capabilities.editStrategy) {
      errors.push(`${provider}: edit strategy disagrees with operation flags.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(capabilities.verifiedAt)) {
      errors.push(`${provider}: verifiedAt must use YYYY-MM-DD.`);
    }
    if (!capabilities.documentationUrl.startsWith("https://")) {
      errors.push(`${provider}: documentation URL must use HTTPS.`);
    }
  }
  return errors;
}
