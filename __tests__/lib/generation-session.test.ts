import { describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import {
  addGenerationCandidates,
  createGenerationSession,
  parentGenerationCandidate,
  selectGenerationCandidate,
  selectedGenerationCandidate,
} from "@/lib/generation-session";

const intent = createAvatarIntent({ mode: "text", styleId: "anime" });
const firstImage = { base64: "first", mimeType: "image/png" } as const;
const editedImage = { base64: "edited", mimeType: "image/png" } as const;

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
    });

    expect(selectedGenerationCandidate(edited)?.image).toBe(editedImage);
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
  });
});
