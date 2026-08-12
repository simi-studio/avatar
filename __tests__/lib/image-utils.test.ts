import { describe, expect, it } from "vitest";

import {
  computeScaledDimensions,
  meanLumaFromRgba,
} from "@/lib/image-utils";

describe("computeScaledDimensions", () => {
  it("leaves small images unchanged", () => {
    expect(computeScaledDimensions(800, 600, 1024)).toEqual({
      width: 800,
      height: 600,
    });
  });

  it("scales down while preserving aspect ratio", () => {
    expect(computeScaledDimensions(2048, 1024, 1024)).toEqual({
      width: 1024,
      height: 512,
    });
  });

  it("scales portrait images by their longest side", () => {
    expect(computeScaledDimensions(1024, 2048, 1024)).toEqual({
      width: 512,
      height: 1024,
    });
  });

  it("handles degenerate dimensions", () => {
    expect(computeScaledDimensions(0, 0, 1024)).toEqual({
      width: 0,
      height: 0,
    });
  });

  it("never scales below 1px", () => {
    const result = computeScaledDimensions(10000, 1, 100);
    expect(result.width).toBe(100);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });
});

describe("meanLumaFromRgba", () => {
  it("scores dark samples low and bright samples high", () => {
    const dark = new Uint8ClampedArray([8, 8, 8, 255, 10, 10, 10, 255]);
    const bright = new Uint8ClampedArray([250, 250, 250, 255, 240, 240, 240, 255]);
    expect(meanLumaFromRgba(dark, 1)).toBeLessThan(20);
    expect(meanLumaFromRgba(bright, 1)).toBeGreaterThan(230);
  });

  it("composites transparent pixels onto white instead of treating them as dark", () => {
    const transparentBlack = new Uint8ClampedArray([0, 0, 0, 0]);
    expect(meanLumaFromRgba(transparentBlack, 1)).toBe(255);
  });
});
