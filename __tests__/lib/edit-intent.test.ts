import { describe, expect, it } from "vitest";

import {
  applyConstrainedEditAction,
  compileEditInstruction,
  editIntentForAction,
  editIntentForConstrainedAction,
  editIntentFromText,
  editItemsToText,
  isEditPlanReady,
  normalizeEditIntent,
  textToEditItems,
  updateEditPlanField,
} from "@/lib/edit-intent";

describe("edit intent", () => {
  it("separates a requested change from explicit preservation constraints", () => {
    const intent = editIntentForAction("cleaner-background");
    expect(intent.change[0]).toContain("background");
    expect(intent.preserve.join(" ")).toContain("identity");
    expect(compileEditInstruction(intent)).toContain("Do not redesign");
    expect(compileEditInstruction(intent)).toContain("Requested changes");
    expect(compileEditInstruction(intent)).toContain("sole source of truth");
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

  it("expands short preserve tokens used by fixtures and the plan UI", () => {
    const intent = normalizeEditIntent({
      change: ["background: light gray"],
      preserve: ["identity", "expression", "clothing", "framing"],
    });
    expect(intent?.preserve.join(" ")).toContain("face shape");
    expect(intent?.preserve.join(" ")).toContain("camera distance");
    expect(compileEditInstruction(intent!)).toContain("face shape");
  });

  it("builds constrained actions for background, clothing, expression, framing, and realism", () => {
    expect(editIntentForConstrainedAction("background").change[0]).toContain(
      "background",
    );
    expect(editIntentForConstrainedAction("clothing").change[0]).toContain(
      "clothing",
    );
    expect(editIntentForConstrainedAction("expression").change[0]).toMatch(
      /subtle|smile/i,
    );
    expect(editIntentForConstrainedAction("framing").change[0]).toMatch(
      /crop|framing/i,
    );
    expect(editIntentForConstrainedAction("realism").change[0]).toContain(
      "realism",
    );
  });

  it("adds a minimal-expression guard when the change mentions a smile", () => {
    const compiled = compileEditInstruction({
      change: ["expression: slightly warmer smile"],
      preserve: ["identity", "framing"],
    });
    expect(compiled).toMatch(/minimal|wide open-mouth/i);
  });

  it("strengthens face preservation for keep-face without dropping prior changes", () => {
    const base = editIntentForConstrainedAction("background");
    const withFace = applyConstrainedEditAction(base, "keep-face");
    expect(withFace.change).toEqual(base.change);
    expect(withFace.preserve.join(" ").toLowerCase()).toContain("face");
  });

  it("round-trips multi-line plan fields and reports readiness", () => {
    const draft = updateEditPlanField(
      { change: [], preserve: [] },
      "change",
      "add glasses\n\nwarm light",
    );
    expect(draft.change).toEqual(["add glasses", "warm light"]);
    expect(editItemsToText(draft.change)).toBe("add glasses\nwarm light");
    expect(textToEditItems("a\nb\n")).toEqual(["a", "b"]);
    expect(isEditPlanReady(draft)).toBe(true);
    expect(isEditPlanReady({ change: [], preserve: ["face"] })).toBe(false);
  });
});
