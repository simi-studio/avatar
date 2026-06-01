import { describe, expect, it } from "vitest";

import {
  isAcceptedImageType,
  isValidProvider,
  isValidRegion,
  isValidSize,
  validateImageFile,
  validateModeInput,
  validateProviderRegion,
} from "@/lib/validation";
import { MAX_IMAGE_BYTES } from "@/lib/constants";

describe("type guards", () => {
  it("accepts supported image types only", () => {
    expect(isAcceptedImageType("image/png")).toBe(true);
    expect(isAcceptedImageType("image/jpeg")).toBe(true);
    expect(isAcceptedImageType("image/webp")).toBe(true);
    expect(isAcceptedImageType("image/gif")).toBe(false);
  });

  it("validates sizes, providers and regions", () => {
    expect(isValidSize("1024x1024")).toBe(true);
    expect(isValidSize("800x600")).toBe(false);
    expect(isValidProvider("openai")).toBe(true);
    expect(isValidProvider("stability")).toBe(false);
    expect(isValidRegion("china")).toBe(true);
    expect(isValidRegion("mars")).toBe(false);
  });
});

describe("validateImageFile", () => {
  it("rejects unsupported types", () => {
    expect(validateImageFile({ type: "image/gif", size: 100 })).toBe(
      "UNSUPPORTED_FILE_TYPE",
    );
  });

  it("rejects oversized files", () => {
    expect(
      validateImageFile({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }),
    ).toBe("IMAGE_TOO_LARGE");
  });

  it("rejects empty files", () => {
    expect(validateImageFile({ type: "image/png", size: 0 })).toBe(
      "INVALID_IMAGE",
    );
  });

  it("accepts valid files", () => {
    expect(validateImageFile({ type: "image/png", size: 1024 })).toBeNull();
  });
});

describe("validateModeInput", () => {
  it("requires exactly one image and a style for single", () => {
    expect(
      validateModeInput({ mode: "single", imageCount: 1, styleId: "anime" }),
    ).toBeNull();
    expect(
      validateModeInput({ mode: "single", imageCount: 0, styleId: "anime" }),
    ).toBe("INVALID_MODE_INPUT");
    expect(validateModeInput({ mode: "single", imageCount: 1 })).toBe(
      "INVALID_MODE_INPUT",
    );
  });

  it("requires exactly two images for couple", () => {
    expect(
      validateModeInput({ mode: "couple", imageCount: 2, styleId: "anime" }),
    ).toBeNull();
    expect(
      validateModeInput({ mode: "couple", imageCount: 1, styleId: "anime" }),
    ).toBe("INVALID_MODE_INPUT");
  });

  it("requires theme and variant but no image for themed", () => {
    expect(
      validateModeInput({
        mode: "themed",
        imageCount: 0,
        themeId: "dogs",
        variantId: "corgi",
      }),
    ).toBeNull();
    expect(
      validateModeInput({ mode: "themed", imageCount: 0, themeId: "dogs" }),
    ).toBe("INVALID_MODE_INPUT");
    expect(
      validateModeInput({
        mode: "themed",
        imageCount: 1,
        themeId: "dogs",
        variantId: "corgi",
      }),
    ).toBe("INVALID_MODE_INPUT");
  });
});

describe("validateProviderRegion", () => {
  it("requires a valid region for MiniMax", () => {
    expect(validateProviderRegion("minimax", "global")).toBeNull();
    expect(validateProviderRegion("minimax", "china")).toBeNull();
    expect(validateProviderRegion("minimax", undefined)).toBe("INVALID_REGION");
    expect(validateProviderRegion("minimax", "mars")).toBe("INVALID_REGION");
  });

  it("does not require a region for OpenAI", () => {
    expect(validateProviderRegion("openai", undefined)).toBeNull();
  });

  it("rejects unknown providers", () => {
    expect(validateProviderRegion("dalle", undefined)).toBe(
      "INVALID_MODE_INPUT",
    );
  });
});
