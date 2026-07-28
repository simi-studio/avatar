import type { AvatarIntent } from "@/lib/avatar-intent";
import type { GeneratedImage } from "@/lib/types";

export type CandidateOperation = "generate" | "edit" | "regenerate";

export type GenerationCandidate = {
  id: string;
  parentId?: string;
  operation: CandidateOperation;
  intent: AvatarIntent;
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
  },
): GenerationSession {
  const start = session.candidates.length;
  const candidates = input.images.map((image, index) => ({
    id: `${session.id}-candidate-${start + index + 1}`,
    parentId: input.parentId,
    operation: input.operation,
    intent: input.intent,
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
