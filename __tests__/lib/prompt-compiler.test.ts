import { describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import {
  compileAvatarPrompt,
  compileEditPrompt,
} from "@/lib/prompt-compiler";
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

  it("describes one combined frame for couple-text same-frame", () => {
    const intent = createAvatarIntent({
      mode: "couple-text",
      styleId: "anime",
      sameFrame: true,
      subjectDescription: "two friends",
    });
    const compiled = compileAvatarPrompt({ provider: "openai", intent });

    expect(compiled.prompt).toContain("both partners");
    expect(compiled.prompt).toContain("one frame");
    expect(compiled.prompt).toContain("two friends");
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

  it("structures OpenAI photo prompts around avatar output and identity preservation", () => {
    const intent = createAvatarIntent({
      mode: "single",
      goal: "professional-profile",
      styleId: "professional-headshot",
      likeness: "high",
      composition: "headshot",
      background: "studio",
      avoid: "changing identity",
    });
    const compiled = compileAvatarPrompt({ provider: "openai", intent });

    expect(compiled.prompt).toContain("Output: square avatar");
    expect(compiled.prompt).toContain("Keep the subject centered");
    expect(compiled.prompt).toContain("Preserve the person's identity");
    expect(compiled.prompt).toContain("face shape");
    expect(compiled.prompt).toContain("Do not invent a different person");
    expect(compiled.prompt).toContain("restrained");
    expect(compiled.prompt).not.toMatch(/imaginative avatar treatment/i);
    expect(compiled.prompt).toContain("Do not add text, logos, or watermarks");
  });

  it("requires unblended identities for same-frame couple outputs", () => {
    const intent = createAvatarIntent({
      mode: "couple-text",
      styleId: "pixar-3d",
      sameFrame: true,
      subjectDescription: "two founders",
    });
    const openai = compileAvatarPrompt({ provider: "openai", intent });
    const minimax = compileAvatarPrompt({ provider: "minimax", intent });
    expect(openai.prompt).toContain("distinct");
    expect(openai.prompt).toContain("unblended");
    expect(minimax.prompt).toContain("no identity blend");
    expect(minimax.prompt).not.toContain("single subject");
  });

  it("injects multi-reference role guidance when provided", () => {
    const intent = createAvatarIntent({
      mode: "single",
      styleId: "professional-headshot",
      likeness: "high",
    });
    const compiled = compileAvatarPrompt({
      provider: "openai",
      intent,
      referenceGuidance:
        "Image 1 is the frontal identity reference for the subject. Image 2 is the three-quarter or profile identity reference for the subject.",
    });
    expect(compiled.prompt).toContain("frontal identity reference");
    expect(compiled.prompt).toContain("profile identity reference");
  });

  it("compiles edit prompts without generate-style redesign language", () => {
    const openai = compileEditPrompt({
      provider: "openai",
      editIntent: {
        change: ["background: light gray"],
        preserve: ["identity", "expression", "clothing", "framing"],
      },
    });
    const minimax = compileEditPrompt({
      provider: "minimax",
      editIntent: {
        change: ["expression: slightly warmer smile"],
        preserve: ["identity", "background", "clothing"],
      },
    });

    expect(openai.prompt).toContain("Requested changes");
    expect(openai.prompt).toContain("background: light gray");
    expect(openai.prompt).not.toContain("Create professional profile avatar");
    expect(openai.prompt).not.toMatch(/creativity|imaginative/i);
    expect(openai.referenceStrength).toBe(0.95);

    expect(minimax.prompt).toContain("change:");
    expect(minimax.prompt).toContain("preserve:");
    expect(minimax.prompt).not.toContain("professional profile avatar");
    expect(minimax.referenceStrength).toBe(0.95);
  });

  it("does not contradict an explicitly requested crop change", () => {
    const editIntent = {
      change: ["tighten the crop to a headshot"],
      preserve: ["identity", "clothing"],
    };
    const openai = compileEditPrompt({ provider: "openai", editIntent });
    const minimax = compileEditPrompt({ provider: "minimax", editIntent });

    expect(openai.prompt).toContain("unless explicitly requested above");
    expect(minimax.prompt).not.toContain("no re-crop");
    expect(minimax.prompt).toContain("preserve unrequested");
  });

  it("includes a reviewed edit plan in regeneration prompts", () => {
    const intent = createAvatarIntent({
      mode: "themed",
      themeId: "dogs",
      variantId: "corgi",
    });
    const compiled = compileAvatarPrompt({
      provider: "openai",
      intent,
      theme: getThemeById("dogs"),
      variant: getVariant("dogs", "corgi"),
      refinementGuidance:
        "Requested changes: use a light gray background. Must preserve unchanged: clothing.",
    });

    expect(compiled.prompt).toContain("light gray background");
    expect(compiled.prompt).toContain("Must preserve unchanged: clothing");
  });

  it("guards stylized photo restyles against age-shift and eye caricature", () => {
    const intent = createAvatarIntent({
      mode: "single",
      styleId: "anime",
      likeness: "high",
      goal: "social-avatar",
    });
    const compiled = compileAvatarPrompt({
      provider: "openai",
      intent,
      style: getStyleById("anime"),
    });
    expect(compiled.prompt).toMatch(/age-shift|enlarge eyes/i);
    expect(compiled.prompt).toContain("48");
  });
});
