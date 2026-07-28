import type { RefinementAction } from "@/lib/avatar-intent";

const MAX_EDIT_ITEMS = 8;
const MAX_EDIT_ITEM_LENGTH = 240;

export const DEFAULT_EDIT_PRESERVE = [
  "the subject's identity and recognizable facial features",
  "the current pose and facial expression unless the change requires it",
  "the current framing, composition, and camera angle",
  "all clothing, accessories, lighting, and background details not mentioned",
] as const;

export type EditIntent = {
  change: string[];
  preserve: string[];
};

const CHANGE_BY_ACTION: Record<RefinementAction, string> = {
  "closer-likeness":
    "make the face more faithful to the selected result without changing the person's identity",
  "more-realistic":
    "increase photographic realism and natural skin, hair, and lighting detail",
  "more-cute":
    "make the visual treatment cuter while keeping the same recognizable person",
  "cleaner-background":
    "simplify and clean up the background without changing the subject",
  variation:
    "create a subtle variation of the selected result while preserving the same subject and overall direction",
};

function normalizeItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_EDIT_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_EDIT_ITEMS);
}

export function normalizeEditIntent(value: unknown): EditIntent | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const change = normalizeItems(record.change);
  if (change.length === 0) return null;
  const preserve = normalizeItems(record.preserve);
  return {
    change,
    preserve:
      preserve.length > 0 ? preserve : Array.from(DEFAULT_EDIT_PRESERVE),
  };
}

export function editIntentForAction(action: RefinementAction): EditIntent {
  return {
    change: [CHANGE_BY_ACTION[action]],
    preserve: Array.from(DEFAULT_EDIT_PRESERVE),
  };
}

export function editIntentFromText(text: string): EditIntent | null {
  const change = text.trim().slice(0, MAX_EDIT_ITEM_LENGTH);
  if (!change) return null;
  return {
    change: [change],
    preserve: Array.from(DEFAULT_EDIT_PRESERVE),
  };
}

export function compileEditInstruction(intent: EditIntent): string {
  return [
    `Edit only these requested details: ${intent.change.join("; ")}.`,
    `Preserve unchanged: ${intent.preserve.join("; ")}.`,
    "Use the supplied image as the source of truth. Do not redesign unrelated details.",
  ].join(" ");
}
