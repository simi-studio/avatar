import { describe, expect, it } from "vitest";

import {
  DEFAULT_MODE_BY_SOURCE,
  GENERATION_MODES,
  MODES_BY_SOURCE,
  REQUIRED_IMAGE_COUNT,
  isPhotoMode,
  sourceForMode,
} from "@/lib/constants";

describe("input-source helpers", () => {
  it("maps each mode to the correct input source", () => {
    expect(sourceForMode("text")).toBe("text");
    expect(sourceForMode("themed")).toBe("text");
    expect(sourceForMode("single")).toBe("photo");
    expect(sourceForMode("couple")).toBe("photo");
  });

  it("flags only photo modes as requiring an upload", () => {
    expect(isPhotoMode("text")).toBe(false);
    expect(isPhotoMode("themed")).toBe(false);
    expect(isPhotoMode("single")).toBe(true);
    expect(isPhotoMode("couple")).toBe(true);
  });

  it("keeps the source mode lists consistent with the source mapping", () => {
    for (const [src, modes] of Object.entries(MODES_BY_SOURCE)) {
      for (const mode of modes) {
        expect(sourceForMode(mode)).toBe(src);
      }
    }
  });

  it("defaults each source to a mode that belongs to it", () => {
    for (const [src, mode] of Object.entries(DEFAULT_MODE_BY_SOURCE)) {
      expect(sourceForMode(mode)).toBe(src);
    }
  });

  it("requires no upload for text-based modes and uploads for photo modes", () => {
    expect(REQUIRED_IMAGE_COUNT.text).toBe(0);
    expect(REQUIRED_IMAGE_COUNT.themed).toBe(0);
    expect(REQUIRED_IMAGE_COUNT.single).toBe(1);
    expect(REQUIRED_IMAGE_COUNT.couple).toBe(2);
  });

  it("includes text as the first (default) generation mode", () => {
    expect(GENERATION_MODES[0]).toBe("text");
  });
});
