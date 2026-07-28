import { describe, expect, it } from "vitest";

import { generatedImageToFile } from "@/lib/generated-image-file";

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
