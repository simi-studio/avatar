import { describe, expect, it } from "vitest";

import {
  AVATAR_BACKGROUNDS,
  AVATAR_COMPOSITIONS,
  AVATAR_GOALS,
  GOAL_PRESETS,
  applyGoalPreset,
  applyRefinementAction,
  createAvatarIntent,
  parseAvatarIntentJson,
} from "@/lib/avatar-intent";
import { GENERATION_MODES } from "@/lib/constants";

describe("AvatarIntent", () => {
  it("creates one canonical intent shape for every generation mode", () => {
    for (const mode of GENERATION_MODES) {
      const intent = createAvatarIntent({ mode });
      expect(intent.mode).toBe(mode);
      expect(intent.goal).toBe("professional-profile");
      expect(intent.styleId).toBe(GOAL_PRESETS["professional-profile"].styleId);
      expect(AVATAR_COMPOSITIONS).toContain(intent.composition);
      expect(AVATAR_BACKGROUNDS).toContain(intent.background);
    }
  });

  it("applies goal presets while keeping the current mode", () => {
    const base = createAvatarIntent({ mode: "single", styleId: "anime" });
    const intent = applyGoalPreset(base, "team-character");
    expect(intent.mode).toBe("single");
    expect(intent.goal).toBe("team-character");
    expect(intent.styleId).toBe(GOAL_PRESETS["team-character"].styleId);
    expect(intent.composition).toBe("half-body");
  });

  it("normalizes parsed JSON and falls back safely on malformed input", () => {
    const fallback = createAvatarIntent({ mode: "text" });
    const parsed = parseAvatarIntentJson(
      JSON.stringify({
        mode: "couple",
        goal: "social-avatar",
        likeness: "high",
        composition: "full-body",
        background: "scene",
        subjectDescription: "  a confident founder  ",
        size: "512x512",
      }),
      fallback,
    );
    expect(parsed.mode).toBe("couple");
    expect(parsed.goal).toBe("social-avatar");
    expect(parsed.subjectDescription).toBe("a confident founder");
    expect(parsed.size).toBe("512x512");
    expect(parseAvatarIntentJson("{", fallback)).toBe(fallback);
  });

  it("supports the recommended goal set", () => {
    expect(AVATAR_GOALS).toEqual([
      "professional-profile",
      "social-avatar",
      "team-character",
      "character",
    ]);
  });

  it("updates intent for one-click refinement actions", () => {
    const base = createAvatarIntent({
      mode: "single",
      styleId: "anime",
      avoid: "watermark",
    });
    expect(applyRefinementAction(base, "closer-likeness").likeness).toBe(
      "high",
    );
    expect(applyRefinementAction(base, "more-realistic").styleId).toBe(
      "professional-headshot",
    );
    expect(applyRefinementAction(base, "more-cute").creativity).toBe("high");
    expect(applyRefinementAction(base, "cleaner-background").background).toBe(
      "plain",
    );
    expect(applyRefinementAction(base, "variation").variation).toBe(true);
  });
});
