import { describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import {
  addGenerationCandidates,
  candidateAncestors,
  candidateStepGroup,
  createGenerationSession,
  hasGenerationCandidate,
  parentGenerationCandidate,
  selectGenerationCandidate,
  selectedGenerationCandidate,
} from "@/lib/generation-session";

const intent = createAvatarIntent({ mode: "text", styleId: "anime" });
const firstImage = { base64: "first", mimeType: "image/png" } as const;
const editedImage = { base64: "edited", mimeType: "image/png" } as const;
const branchImage = { base64: "branch", mimeType: "image/png" } as const;

describe("generation session", () => {
  it("keeps an in-memory candidate graph and supports restoring a parent", () => {
    const generated = addGenerationCandidates(createGenerationSession("test"), {
      intent,
      images: [firstImage],
      operation: "generate",
    });
    const parentId = selectedGenerationCandidate(generated)?.id;
    const edited = addGenerationCandidates(generated, {
      intent,
      images: [editedImage],
      operation: "edit",
      parentId,
      editIntent: {
        change: ["cleaner background"],
        preserve: ["identity"],
      },
    });

    expect(selectedGenerationCandidate(edited)?.image).toBe(editedImage);
    expect(selectedGenerationCandidate(edited)?.change).toEqual([
      "cleaner background",
    ]);
    expect(parentGenerationCandidate(edited)?.image).toBe(firstImage);

    const restored = selectGenerationCandidate(edited, parentId ?? "");
    expect(selectedGenerationCandidate(restored)?.image).toBe(firstImage);
  });

  it("ignores an unknown candidate id", () => {
    const session = addGenerationCandidates(createGenerationSession("test"), {
      intent,
      images: [firstImage],
      operation: "generate",
    });
    expect(selectGenerationCandidate(session, "missing")).toBe(session);
    expect(hasGenerationCandidate(session, "missing")).toBe(false);
    expect(hasGenerationCandidate(session, undefined)).toBe(false);
  });

  it("reports ancestors for branch navigation", () => {
    const root = addGenerationCandidates(createGenerationSession("test"), {
      intent,
      images: [firstImage],
      operation: "generate",
    });
    const rootId = selectedGenerationCandidate(root)?.id ?? "";
    const child = addGenerationCandidates(root, {
      intent,
      images: [editedImage],
      operation: "edit",
      parentId: rootId,
    });
    const childId = selectedGenerationCandidate(child)?.id ?? "";
    const grand = addGenerationCandidates(child, {
      intent,
      images: [branchImage],
      operation: "edit",
      parentId: childId,
    });
    const grandId = selectedGenerationCandidate(grand)?.id ?? "";

    expect(candidateAncestors(grand, grandId).map((c) => c.id)).toEqual([
      rootId,
      childId,
    ]);
    expect(hasGenerationCandidate(grand, rootId)).toBe(true);
  });

  it("restores a labeled couple pair from the same step", () => {
    const pair = addGenerationCandidates(createGenerationSession("test"), {
      intent: createAvatarIntent({ mode: "couple-text", styleId: "anime" }),
      images: [
        { base64: "a", mimeType: "image/png", label: "A" },
        { base64: "b", mimeType: "image/png", label: "B" },
      ],
      operation: "generate",
    });
    const second = pair.candidates[1];
    expect(second).toBeDefined();
    const group = candidateStepGroup(pair, second!.id);
    expect(group.map((candidate) => candidate.image.label)).toEqual(["A", "B"]);
  });
});
