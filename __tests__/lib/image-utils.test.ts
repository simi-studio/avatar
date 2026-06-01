import { describe, expect, it } from "vitest";

import { computeScaledDimensions } from "@/lib/image-utils";

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
