import { describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import {
  applyBriefRefinement,
  matchBriefSignals,
  parseBriefToIntent,
} from "@/lib/avatar-brief";

const textBase = createAvatarIntent({ mode: "text" });

describe("parseBriefToIntent", () => {
  it("maps a professional brief to the expected intent deterministically", () => {
    const intent = parseBriefToIntent(textBase, "LinkedIn headshot, friendly");
    expect(intent.goal).toBe("professional-profile");
    expect(intent.composition).toBe("headshot");
    expect(intent.background).toBe("studio");
    expect(intent.likeness).toBe("high");
    // The brief itself is preserved as the subject description.
    expect(intent.subjectDescription).toBe("LinkedIn headshot, friendly");
  });

  it("detects style, goal, and framing keywords", () => {
    const intent = parseBriefToIntent(textBase, "anime social avatar, full body");
    expect(intent.goal).toBe("social-avatar");
    expect(intent.styleId).toBe("anime");
    expect(intent.composition).toBe("full-body");
  });

  it("keeps the base intent but records the description when nothing matches", () => {
    const intent = parseBriefToIntent(textBase, "with a red scarf");
    expect(intent.goal).toBe(textBase.goal);
    expect(intent.styleId).toBe(textBase.styleId);
    expect(intent.subjectDescription).toBe("with a red scarf");
  });

  it("does no LLM/network work — it is a pure signal lookup", () => {
    expect(matchBriefSignals("realistic cyberpunk portrait")).toEqual({
      goal: undefined,
      styleId: "cyberpunk",
      composition: "headshot",
      background: undefined,
      likeness: undefined,
      creativity: "low",
      action: undefined,
    });
  });
});

describe("applyBriefRefinement", () => {
  it("resolves an action phrase to the matching one-shot refinement", () => {
    const intent = applyBriefRefinement(textBase, "more like me");
    expect(intent.likeness).toBe("high");
    expect(intent.creativity).toBe("low");
  });

  it("maps a goal phrase to a goal-preset delta", () => {
    const social = createAvatarIntent({ mode: "text", goal: "social-avatar" });
    const intent = applyBriefRefinement(social, "make it work for LinkedIn");
    expect(intent.goal).toBe("professional-profile");
  });

  it("folds an unrecognized note into the description without changing controls", () => {
    const base = createAvatarIntent({
      mode: "text",
      subjectDescription: "a founder",
    });
    const intent = applyBriefRefinement(base, "with a red scarf");
    expect(intent.goal).toBe(base.goal);
    expect(intent.composition).toBe(base.composition);
    expect(intent.subjectDescription).toBe("a founder, with a red scarf");
  });

  it("returns the same intent for empty refinement text", () => {
    const intent = applyBriefRefinement(textBase, "   ");
    expect(intent).toEqual(textBase);
  });
});
