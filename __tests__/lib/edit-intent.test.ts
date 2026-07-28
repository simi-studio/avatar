import { describe, expect, it } from "vitest";

import {
  compileEditInstruction,
  editIntentForAction,
  editIntentFromText,
  normalizeEditIntent,
} from "@/lib/edit-intent";

describe("edit intent", () => {
  it("separates a requested change from explicit preservation constraints", () => {
    const intent = editIntentForAction("cleaner-background");
    expect(intent.change[0]).toContain("background");
    expect(intent.preserve.join(" ")).toContain("identity");
    expect(compileEditInstruction(intent)).toContain("Do not redesign");
  });

  it("normalizes user text and rejects empty or malformed plans", () => {
    expect(editIntentFromText("  add warmer light  ")).toMatchObject({
      change: ["add warmer light"],
    });
    expect(editIntentFromText("   ")).toBeNull();
    expect(normalizeEditIntent({ change: [] })).toBeNull();
    expect(
      normalizeEditIntent({ change: ["add glasses"], preserve: [] })?.preserve,
    ).not.toHaveLength(0);
  });
});
