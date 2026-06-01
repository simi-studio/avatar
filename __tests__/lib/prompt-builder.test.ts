import { describe, expect, it } from "vitest";

import { buildPrompt } from "@/lib/prompt-builder";
import { getStyleById } from "@/styles/avatar-styles";
import { getThemeById, getVariant } from "@/styles/avatar-themes";

describe("buildPrompt", () => {
  it("builds a text-mode prompt from description + style with no face reference", () => {
    const prompt = buildPrompt({
      mode: "text",
      style: getStyleById("anime"),
      userPrompt: "a friendly portrait with a warm smile",
    });
    expect(prompt).toContain("a friendly portrait with a warm smile");
    expect(prompt).toContain("anime avatar");
    expect(prompt).not.toContain("facial features");
  });

  it("falls back to a default subject when text mode has no description", () => {
    const prompt = buildPrompt({
      mode: "text",
      style: getStyleById("anime"),
    });
    expect(prompt).toContain("a friendly portrait avatar");
  });

  it("builds a single-mode prompt that preserves facial features", () => {
    const prompt = buildPrompt({
      mode: "single",
      style: getStyleById("anime"),
      userPrompt: "blue background",
    });
    expect(prompt).toContain("anime avatar");
    expect(prompt).toContain("Preserve facial identity closely");
    expect(prompt).toContain("blue background");
  });

  it("reuses the same prompt for couple mode", () => {
    const style = getStyleById("pixar-3d");
    const a = buildPrompt({ mode: "couple", style, userPrompt: "park" });
    const b = buildPrompt({ mode: "couple", style, userPrompt: "park" });
    expect(a).toBe(b);
    expect(a).toContain("3D animated character");
  });

  it("adds a paired-consistency fragment only for couple mode when enabled", () => {
    const style = getStyleById("pixar-3d");
    const consistent = buildPrompt({
      mode: "couple",
      style,
      pairedConsistency: true,
    });
    const independent = buildPrompt({
      mode: "couple",
      style,
      pairedConsistency: false,
    });
    expect(consistent).toContain("consistent across both avatars");
    expect(independent).not.toContain("consistent across both avatars");

    // The flag is ignored outside couple mode.
    const single = buildPrompt({
      mode: "single",
      style,
      pairedConsistency: true,
    });
    expect(single).not.toContain("consistent across both avatars");
  });

  it("builds a themed prompt with theme base + variant fragment and no face reference", () => {
    const prompt = buildPrompt({
      mode: "themed",
      theme: getThemeById("dogs"),
      variant: getVariant("dogs", "shiba-inu"),
      userPrompt: "wearing glasses",
    });
    expect(prompt).toContain("anthropomorphic dog");
    expect(prompt).toContain("shiba inu");
    expect(prompt).toContain("wearing glasses");
    expect(prompt).not.toContain("facial features");
  });

  it("ignores empty user prompts", () => {
    const prompt = buildPrompt({
      mode: "single",
      style: getStyleById("cyberpunk"),
      userPrompt: "   ",
    });
    expect(prompt.endsWith("  ")).toBe(false);
  });
});
