import { describe, expect, it } from "vitest";

import {
  GALLERY_EXAMPLES,
  OG_IMAGE_SRC,
  getGalleryExample,
} from "@/lib/gallery";

describe("gallery", () => {
  it("resolves known sample looks and ignores missing ids", () => {
    expect(getGalleryExample("professional")?.styleId).toBe(
      "professional-headshot",
    );
    expect(getGalleryExample("corgi")?.mode).toBe("themed");
    expect(getGalleryExample("missing")).toBeUndefined();
    expect(GALLERY_EXAMPLES.every((example) => example.src.startsWith("/gallery/"))).toBe(
      true,
    );
    expect(OG_IMAGE_SRC).toBe("/og.jpg");
  });
});
