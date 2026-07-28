import { describe, expect, it } from "vitest";

import {
  PROVIDER_CAPABILITIES,
  capabilitiesForProvider,
  capabilityRegistryErrors,
  defaultSizeForProvider,
  isCapabilityVerificationStale,
  modelLabelForProvider,
  pricingUrlForProvider,
  resolveEditStrategy,
  sizesForProvider,
  supportsReferenceRequest,
} from "@/lib/provider-capabilities";
import { PROVIDERS } from "@/lib/constants";

describe("provider capabilities", () => {
  it("exposes only real OpenAI image sizes", () => {
    expect(sizesForProvider("openai")).toEqual(["1024x1024"]);
    expect(defaultSizeForProvider("openai")).toBe("1024x1024");
  });

  it("exposes both MiniMax MVP image sizes", () => {
    expect(sizesForProvider("minimax")).toEqual(["512x512", "1024x1024"]);
    expect(defaultSizeForProvider("minimax")).toBe("1024x1024");
  });

  it("exposes the square 1k size used for xAI Grok Imagine avatars", () => {
    expect(sizesForProvider("xai")).toEqual(["1024x1024"]);
    expect(defaultSizeForProvider("xai")).toBe("1024x1024");
    expect(modelLabelForProvider("xai")).toBe("grok-imagine-image-quality");
    expect(pricingUrlForProvider("xai")).toMatch(/^https:\/\/docs\.x\.ai\//);
  });

  it("defines a complete internally consistent v2 registry", () => {
    expect(Object.keys(PROVIDER_CAPABILITIES).sort()).toEqual(
      [...PROVIDERS].sort(),
    );
    expect(capabilityRegistryErrors()).toEqual([]);
  });

  it("keeps unverified identity and composite claims disabled", () => {
    for (const provider of PROVIDERS) {
      const capabilities = capabilitiesForProvider(provider);
      expect(capabilities.identityPreservation).toBe("none");
      expect(capabilities.supportsMultiTurnEdit).toBe(false);
      expect(capabilities.supportsMultiImageComposite).toBe(false);
      expect(
        resolveEditStrategy(provider, {
          hasSelectedImageInput: true,
          hasContinuation: false,
        }),
      ).toBe("image-edit");
    }
  });

  it("labels text-only refinement as regeneration even when image edit exists", () => {
    expect(
      resolveEditStrategy("openai", {
        hasSelectedImageInput: false,
        hasContinuation: false,
      }),
    ).toBe("regenerate");
  });

  it("enforces the reference limits implemented by current adapters", () => {
    expect(supportsReferenceRequest("openai", 1, 1)).toBe(true);
    expect(supportsReferenceRequest("openai", 2, 1)).toBe(false);
    expect(supportsReferenceRequest("xai", 2, 2)).toBe(false);
  });

  it("flags stale verification dates for the release guard", () => {
    expect(
      isCapabilityVerificationStale(
        "openai",
        new Date("2026-08-01T00:00:00.000Z"),
      ),
    ).toBe(false);
    expect(
      isCapabilityVerificationStale(
        "openai",
        new Date("2027-01-01T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("keeps every provider inside the critical verification window", () => {
    for (const provider of PROVIDERS) {
      expect(isCapabilityVerificationStale(provider)).toBe(false);
    }
  });
});
