import { describe, expect, it } from "vitest";

import {
  generatedImageSrc,
  generatedImageToFile,
} from "@/lib/generated-image-file";

describe("generatedImageToFile", () => {
  it("creates an in-memory edit upload from a base64 provider result", () => {
    const file = generatedImageToFile({
      base64: "iVBORw0KGgo=",
      mimeType: "image/png",
    });

    expect(file).not.toBeNull();
    expect(file?.name).toBe("selected-avatar.png");
    expect(file?.type).toBe("image/png");
    expect(file?.size).toBe(8);
  });

  it("does not attempt to turn a remote URL into an upload", () => {
    expect(
      generatedImageToFile({
        url: "https://example.test/avatar.png",
        mimeType: "image/png",
      }),
    ).toBeNull();
  });
});

describe("generatedImageSrc", () => {
  it("prefers an in-memory base64 result and falls back to a URL", () => {
    expect(
      generatedImageSrc({ base64: "AAAA", mimeType: "image/png" }),
    ).toBe("data:image/png;base64,AAAA");
    expect(
      generatedImageSrc({ url: "https://example.test/a.webp", mimeType: "image/webp" }),
    ).toBe("https://example.test/a.webp");
  });
});
