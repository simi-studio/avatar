import type { RefinementAction } from "@/lib/avatar-intent";

const MAX_EDIT_ITEMS = 8;
const MAX_EDIT_ITEM_LENGTH = 240;

export const DEFAULT_EDIT_PRESERVE = [
  "the subject's identity and recognizable facial features",
  "the current pose and facial expression unless the change requires it",
  "the current framing, composition, and camera angle",
  "all clothing, accessories, lighting, and background details not mentioned",
] as const;

/** Common constrained edit chips shown before the paid call (Epic 11.3). */
export const CONSTRAINED_EDIT_ACTIONS = [
  "background",
  "clothing",
  "expression",
  "framing",
  "realism",
  "keep-face",
] as const;
export type ConstrainedEditAction = (typeof CONSTRAINED_EDIT_ACTIONS)[number];

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

const CHANGE_BY_CONSTRAINED: Record<
  Exclude<ConstrainedEditAction, "keep-face">,
  string
> = {
  background:
    "change the background while keeping the subject and identity intact",
  clothing:
    "change the clothing to a different color or outfit the user will specify, while keeping face, hair, expression, and identity intact",
  expression:
    "make a very subtle warmer closed-mouth smile only; do not open the mouth or create a wide grin",
  framing:
    "tighten the head-and-shoulders crop slightly while keeping the same recognizable person and face size priority",
  realism:
    "increase photographic realism and natural skin, hair, and lighting detail without changing identity",
};

const KEEP_FACE_PRESERVE =
  "the subject's face, identity, and recognizable facial features exactly as shown";

function normalizeItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, MAX_EDIT_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_EDIT_ITEMS);
}

/** Convert free-form multi-line text into bounded edit plan items. */
export function textToEditItems(text: string): string[] {
  return normalizeItems(
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

/** Render edit plan items as one line per item for editable textareas. */
export function editItemsToText(items: string[]): string {
  return items.join("\n");
}

/**
 * Expand short fixture/UI preserve tokens into stronger model instructions.
 * Multimodal edit probes (2026-08) showed terse tokens like "identity" alone
 * are weaker than explicit face-geometry wording when providers also receive
 * style/goal text.
 */
const PRESERVE_TOKEN_EXPANSIONS: Record<string, string> = {
  identity:
    "the subject's identity and recognizable facial features (face shape, eyes, nose, mouth, jawline, skin tone, age)",
  expression:
    "the current facial expression unless the change explicitly requests an expression change",
  hair: "the current hairstyle, hairline, hair length, and hair color",
  clothing:
    "the current clothing, fabric, neckline, and outfit geometry",
  framing:
    "the current framing, head position, shoulder position, and camera distance",
  composition:
    "the current composition, framing, head position, and camera distance",
  background:
    "the current background objects, backdrop color, and scene layout",
  pose: "the current pose and body orientation",
};

function expandPreserveItems(items: string[]): string[] {
  return items.map((item) => {
    const key = item.toLowerCase().trim();
    return PRESERVE_TOKEN_EXPANSIONS[key] ?? item;
  });
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
    preserve: expandPreserveItems(
      preserve.length > 0 ? preserve : Array.from(DEFAULT_EDIT_PRESERVE),
    ),
  };
}

/** True when the draft plan has at least one non-empty change item. */
export function isEditPlanReady(intent: EditIntent | null | undefined): boolean {
  return Boolean(intent && intent.change.some((item) => item.trim().length > 0));
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

export function editIntentForConstrainedAction(
  action: ConstrainedEditAction,
): EditIntent {
  if (action === "keep-face") {
    return {
      change: ["keep the current overall look"],
      preserve: [
        KEEP_FACE_PRESERVE,
        ...DEFAULT_EDIT_PRESERVE.filter(
          (item) => !item.toLowerCase().includes("facial features"),
        ),
      ].slice(0, MAX_EDIT_ITEMS),
    };
  }
  return {
    change: [CHANGE_BY_CONSTRAINED[action]],
    preserve: Array.from(DEFAULT_EDIT_PRESERVE),
  };
}

/**
 * Merge a constrained action into an existing draft plan without losing
 * user-edited items. "keep-face" strengthens preserve only.
 */
export function applyConstrainedEditAction(
  intent: EditIntent,
  action: ConstrainedEditAction,
): EditIntent {
  if (action === "keep-face") {
    const preserve = intent.preserve.some((item) =>
      item.toLowerCase().includes("face"),
    )
      ? intent.preserve
      : [KEEP_FACE_PRESERVE, ...intent.preserve].slice(0, MAX_EDIT_ITEMS);
    return {
      change: normalizeItems(intent.change),
      preserve: normalizeItems(preserve),
    };
  }

  const addition = CHANGE_BY_CONSTRAINED[action];
  const alreadyPresent = intent.change.some(
    (item) => item.toLowerCase() === addition.toLowerCase(),
  );
  const change = alreadyPresent
    ? intent.change
    : [...intent.change, addition].slice(0, MAX_EDIT_ITEMS);
  return {
    change: normalizeItems(change),
    preserve:
      normalizeItems(intent.preserve).length > 0
        ? normalizeItems(intent.preserve)
        : Array.from(DEFAULT_EDIT_PRESERVE),
  };
}

/** Replace change or preserve from editable multi-line text. */
export function updateEditPlanField(
  intent: EditIntent,
  field: "change" | "preserve",
  text: string,
): EditIntent {
  const items = textToEditItems(text);
  if (field === "change") {
    return {
      change: items,
      preserve:
        intent.preserve.length > 0
          ? intent.preserve
          : Array.from(DEFAULT_EDIT_PRESERVE),
    };
  }
  return {
    change: intent.change,
    preserve: items.length > 0 ? items : Array.from(DEFAULT_EDIT_PRESERVE),
  };
}

/**
 * Compile a constrained edit instruction for image-edit providers.
 * Kept free of style/goal/creativity wording — those fight preservation
 * (validated via multimodal probes on the synthetic edit-parent fixture).
 */
export function compileEditInstruction(intent: EditIntent): string {
  const preserve = expandPreserveItems(
    intent.preserve.length > 0
      ? intent.preserve
      : Array.from(DEFAULT_EDIT_PRESERVE),
  );
  const changeText = intent.change.join("; ");
  const expressionChange = /expression|smile|grin/i.test(changeText);
  return [
    "You are editing an existing avatar image. Apply only the requested changes.",
    `Requested changes: ${changeText}.`,
    `Must preserve unchanged: ${preserve.join("; ")}.`,
    "Use the supplied image as the sole source of truth for identity and every non-requested attribute.",
    "Do not redesign, re-style, re-light, re-crop, beautify, or invent new accessories unless explicitly requested above.",
    "Keep the same head position, shoulder position, camera distance, and clothing geometry unless a requested change requires otherwise.",
    expressionChange
      ? "If changing expression, keep the adjustment minimal and natural; avoid a wide open-mouth smile unless explicitly requested."
      : undefined,
    "Change only what is listed under requested changes.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Compile a reviewed plan for a regeneration fallback where the prior result
 * is not sent as edit input. This must not claim that provider has source
 * pixels or can preserve them exactly.
 */
export function compileRegenerationInstruction(intent: EditIntent): string {
  const preserve = expandPreserveItems(
    intent.preserve.length > 0
      ? intent.preserve
      : Array.from(DEFAULT_EDIT_PRESERVE),
  );
  return [
    `Regeneration changes: ${intent.change.join("; ")}.`,
    `Keep these existing intent attributes unchanged where possible: ${preserve.join("; ")}.`,
    "Keep all unmentioned generation settings and the overall avatar direction stable; do not introduce unrelated changes.",
  ].join(" ");
}
