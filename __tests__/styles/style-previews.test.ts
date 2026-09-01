import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OG_IMAGE_HEIGHT, OG_IMAGE_SRC, OG_IMAGE_WIDTH } from "@/lib/gallery";
import {
  STYLE_IDS,
  STYLE_PREVIEW_SRC,
  getStylePreviewSrc,
} from "@/styles/avatar-styles";

describe("style preview tiles", () => {
  it("maps every built-in style to a local public asset", () => {
    expect(Object.keys(STYLE_PREVIEW_SRC).sort()).toEqual([...STYLE_IDS].sort());

    for (const styleId of STYLE_IDS) {
      const src = getStylePreviewSrc(styleId);
      expect(src, styleId).toBeTruthy();
      expect(src?.startsWith("/gallery/") || src?.startsWith("/styles/")).toBe(
        true,
      );
      const relative = src?.replace(/^\//, "") ?? "";
      expect(existsSync(join(process.cwd(), "public", relative)), relative).toBe(
        true,
      );
    }
  });
});

describe("open graph image", () => {
  it("points at the committed landscape collage", () => {
    expect(OG_IMAGE_SRC).toBe("/og.jpg");
    expect(OG_IMAGE_WIDTH).toBe(1200);
    expect(OG_IMAGE_HEIGHT).toBe(630);
    expect(existsSync(join(process.cwd(), "public/og.jpg"))).toBe(true);
  });
});
