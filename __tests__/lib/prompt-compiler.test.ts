import { describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import { compileAvatarPrompt } from "@/lib/prompt-compiler";
import { getStyleById } from "@/styles/avatar-styles";
import { getThemeById, getVariant } from "@/styles/avatar-themes";

describe("compileAvatarPrompt", () => {
  it("compiles one intent into provider-specific prompts", () => {
    const intent = createAvatarIntent({
      mode: "text",
      goal: "professional-profile",
      styleId: "professional-headshot",
      subjectDescription: "a calm founder with short hair",
      background: "studio",
      avoid: "busy background",
    });
    const style = getStyleById(intent.styleId);
    const openai = compileAvatarPrompt({ provider: "openai", intent, style });
    const minimax = compileAvatarPrompt({ provider: "minimax", intent, style });

    expect(openai.prompt).toContain("Create professional profile avatar");
    expect(openai.prompt).toContain("Avoid:");
    expect(minimax.prompt).toContain("professional profile avatar");
    expect(minimax.prompt).toContain("avoid");
    expect(openai.prompt).not.toBe(minimax.prompt);
  });

  it("adds reference strength for photo modes only", () => {
    const photoIntent = createAvatarIntent({
      mode: "single",
      styleId: "linkedin",
      likeness: "high",
    });
    const textIntent = createAvatarIntent({
      mode: "text",
      styleId: "linkedin",
    });
    expect(
      compileAvatarPrompt({ provider: "openai", intent: photoIntent })
        .referenceStrength,
    ).toBe(0.85);
    expect(
      compileAvatarPrompt({ provider: "openai", intent: textIntent })
        .referenceStrength,
    ).toBeUndefined();
  });

  it("uses themed theme and variant fragments", () => {
    const intent = createAvatarIntent({
      mode: "themed",
      themeId: "dogs",
      variantId: "corgi",
      goal: "team-character",
    });
    const compiled = compileAvatarPrompt({
      provider: "minimax",
      intent,
      theme: getThemeById("dogs"),
      variant: getVariant("dogs", "corgi"),
    });
    expect(compiled.prompt).toContain("anthropomorphic dog");
    expect(compiled.prompt).toContain("welsh corgi");
  });

  it("adds MiniMax avatar constraint checklist wording", () => {
    const intent = createAvatarIntent({
      mode: "single",
      styleId: "professional-headshot",
      likeness: "high",
    });
    const compiled = compileAvatarPrompt({ provider: "minimax", intent });

    expect(compiled.prompt).toContain("single subject");
    expect(compiled.prompt).toContain("centered face");
    expect(compiled.prompt).toContain("clear facial identity");
    expect(compiled.prompt).toContain("avatar-safe crop");
    expect(compiled.prompt).toContain("no text");
    expect(compiled.prompt).toContain("no logo");
    expect(compiled.prompt).toContain("no watermark");
  });

  it("adds stronger MiniMax paired consistency constraints", () => {
    const intent = createAvatarIntent({
      mode: "couple-text",
      styleId: "anime",
      pairedConsistency: true,
    });
    const compiled = compileAvatarPrompt({ provider: "minimax", intent });

    expect(compiled.prompt).toContain("same framing");
    expect(compiled.prompt).toContain("same light");
    expect(compiled.prompt).toContain("same background family");
  });

  it("includes variation wording without changing request count", () => {
    const intent = createAvatarIntent({
      mode: "text",
      styleId: "anime",
      variation: true,
    });
    const compiled = compileAvatarPrompt({ provider: "openai", intent });
    expect(compiled.prompt).toContain("fresh variation");
    expect(compiled.n).toBe(1);
  });
});
