import type { AvatarIntent } from "@/lib/avatar-intent";
import type { EditIntent } from "@/lib/edit-intent";
import type { GeneratedImage } from "@/lib/types";

export type CandidateOperation = "generate" | "edit" | "regenerate";

export type GenerationCandidate = {
  id: string;
  parentId?: string;
  operation: CandidateOperation;
  intent: AvatarIntent;
  /** Explicit change instructions used for an edit/regenerate child. */
  change?: string[];
  /** Explicit preserve instructions used for an edit/regenerate child. */
  preserve?: string[];
  image: GeneratedImage;
};

export type GenerationSession = {
  id: string;
  candidates: GenerationCandidate[];
  selectedCandidateId?: string;
};

export function createGenerationSession(id = "active"): GenerationSession {
  return { id, candidates: [] };
}

export function addGenerationCandidates(
  session: GenerationSession,
  input: {
    intent: AvatarIntent;
    images: GeneratedImage[];
    operation: CandidateOperation;
    parentId?: string;
    editIntent?: EditIntent;
  },
): GenerationSession {
  const start = session.candidates.length;
  const candidates = input.images.map((image, index) => ({
    id: `${session.id}-candidate-${start + index + 1}`,
    parentId: input.parentId,
    operation: input.operation,
    intent: input.intent,
    change: input.editIntent?.change,
    preserve: input.editIntent?.preserve,
    image,
  }));
  return {
    ...session,
    candidates: [...session.candidates, ...candidates],
    selectedCandidateId:
      candidates[0]?.id ?? session.selectedCandidateId,
  };
}

export function selectedGenerationCandidate(
  session: GenerationSession,
): GenerationCandidate | undefined {
  return session.candidates.find(
    (candidate) => candidate.id === session.selectedCandidateId,
  );
}

export function parentGenerationCandidate(
  session: GenerationSession,
): GenerationCandidate | undefined {
  const selected = selectedGenerationCandidate(session);
  if (!selected?.parentId) return undefined;
  return session.candidates.find(
    (candidate) => candidate.id === selected.parentId,
  );
}

export function selectGenerationCandidate(
  session: GenerationSession,
  candidateId: string,
): GenerationSession {
  if (!session.candidates.some((candidate) => candidate.id === candidateId)) {
    return session;
  }
  return { ...session, selectedCandidateId: candidateId };
}

/** True when the candidate id still exists in the in-memory session graph. */
export function hasGenerationCandidate(
  session: GenerationSession,
  candidateId: string | undefined,
): boolean {
  if (!candidateId) return false;
  return session.candidates.some((candidate) => candidate.id === candidateId);
}

/**
 * Ancestors of a candidate from root → parent (excluding the candidate itself).
 * Used for branch navigation and review UI.
 */
export function candidateAncestors(
  session: GenerationSession,
  candidateId: string,
): GenerationCandidate[] {
  const byId = new Map(
    session.candidates.map((candidate) => [candidate.id, candidate]),
  );
  const chain: GenerationCandidate[] = [];
  let current = byId.get(candidateId);
  const seen = new Set<string>();
  while (current?.parentId && !seen.has(current.parentId)) {
    seen.add(current.parentId);
    const parent = byId.get(current.parentId);
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}
