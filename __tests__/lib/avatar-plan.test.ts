import { describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import { deriveAvatarPlan } from "@/lib/avatar-plan";

describe("deriveAvatarPlan", () => {
  it("reflects the intent, call count, and risk hints", () => {
    const plan = deriveAvatarPlan(createAvatarIntent({ mode: "text" }));
    expect(plan.goal).toBe("professional-profile");
    expect(plan.generationCount).toBe(1);
    // Default professional intent asks for high likeness with no photo.
    expect(plan.risks).toContain("likeness-without-photo");
    expect(plan.risks).not.toContain("creativity-vs-professional");
  });

  it("flags high creativity against a professional goal", () => {
    const plan = deriveAvatarPlan(
      createAvatarIntent({ mode: "text", creativity: "high" }),
    );
    expect(plan.risks).toContain("creativity-vs-professional");
  });

  it("does not flag missing-photo likeness in a photo mode", () => {
    const plan = deriveAvatarPlan(createAvatarIntent({ mode: "single" }));
    expect(plan.risks).not.toContain("likeness-without-photo");
  });

  it("counts a paired mode as two calls with a consistency risk", () => {
    const plan = deriveAvatarPlan(createAvatarIntent({ mode: "couple-text" }));
    expect(plan.generationCount).toBe(2);
    expect(plan.risks).toContain("pair-consistency");
    expect(plan.risks).not.toContain("same-frame-blend");
  });

  it("counts a same-frame couple as one call with a blend risk", () => {
    const plan = deriveAvatarPlan(
      createAvatarIntent({ mode: "couple-text", sameFrame: true }),
    );
    expect(plan.generationCount).toBe(1);
    expect(plan.risks).toContain("same-frame-blend");
    expect(plan.risks).not.toContain("pair-consistency");
  });

  it("carries no credential, image, or provider-response fields", () => {
    const plan = deriveAvatarPlan(
      createAvatarIntent({ mode: "single", background: "transparent-like" }),
    );
    const forbidden = [
      "apiKey",
      "key",
      "image",
      "images",
      "base64",
      "url",
      "file",
      "token",
      "secret",
    ];
    for (const field of forbidden) {
      expect(Object.prototype.hasOwnProperty.call(plan, field)).toBe(false);
    }
    expect(JSON.stringify(plan)).not.toMatch(/apikey|base64|sk-|bearer/i);
  });
});
