import {
  DEFAULT_IMAGE_SIZE,
  GENERATION_MODES,
  IMAGE_SIZES,
  isCoupleMode,
  type GenerationMode,
  type ImageSize,
} from "@/lib/constants";

export const AVATAR_GOALS = [
  "professional-profile",
  "social-avatar",
  "team-character",
  "character",
] as const;
export type AvatarGoal = (typeof AVATAR_GOALS)[number];

export const INTENT_LEVELS = ["low", "medium", "high"] as const;
export type IntentLevel = (typeof INTENT_LEVELS)[number];

export const AVATAR_COMPOSITIONS = [
  "headshot",
  "half-body",
  "full-body",
] as const;
export type AvatarComposition = (typeof AVATAR_COMPOSITIONS)[number];

export const AVATAR_BACKGROUNDS = [
  "plain",
  "studio",
  "scene",
  "transparent-like",
] as const;
export type AvatarBackground = (typeof AVATAR_BACKGROUNDS)[number];

export const REFINEMENT_ACTIONS = [
  "closer-likeness",
  "more-realistic",
  "more-cute",
  "cleaner-background",
  "variation",
] as const;
export type RefinementAction = (typeof REFINEMENT_ACTIONS)[number];

export type AvatarIntent = {
  mode: GenerationMode;
  goal: AvatarGoal;
  styleId?: string;
  themeId?: string;
  variantId?: string;
  subjectDescription?: string;
  likeness: IntentLevel;
  creativity: IntentLevel;
  composition: AvatarComposition;
  background: AvatarBackground;
  palette?: string;
  mood?: string;
  accessories?: string;
  avoid?: string;
  pairedConsistency?: boolean;
  /** Couple modes: render both partners together in one frame instead of an A/B pair. */
  sameFrame?: boolean;
  variation?: boolean;
  size: ImageSize;
};

export type AvatarGoalPreset = {
  id: AvatarGoal;
  styleId: string;
  likeness: IntentLevel;
  creativity: IntentLevel;
  composition: AvatarComposition;
  background: AvatarBackground;
  palette?: string;
  mood?: string;
  accessories?: string;
  avoid?: string;
};

export const GOAL_PRESETS: Record<AvatarGoal, AvatarGoalPreset> = {
  "professional-profile": {
    id: "professional-profile",
    styleId: "professional-headshot",
    likeness: "high",
    creativity: "low",
    composition: "headshot",
    background: "studio",
    palette: "neutral, polished business colors",
    mood: "confident, warm, approachable",
    avoid: "busy background, harsh shadows, exaggerated features",
  },
  "social-avatar": {
    id: "social-avatar",
    styleId: "anime",
    likeness: "medium",
    creativity: "medium",
    composition: "headshot",
    background: "scene",
    palette: "bright, friendly colors",
    mood: "expressive, relaxed, memorable",
    avoid: "dull lighting, stiff expression, messy background",
  },
  "team-character": {
    id: "team-character",
    styleId: "pixar-3d",
    likeness: "medium",
    creativity: "medium",
    composition: "half-body",
    background: "plain",
    palette: "cohesive team palette",
    mood: "friendly, cohesive, playful",
    avoid: "inconsistent lighting, mismatched background, text",
  },
  character: {
    id: "character",
    styleId: "fantasy-hero",
    likeness: "low",
    creativity: "high",
    composition: "half-body",
    background: "scene",
    palette: "cinematic accent colors",
    mood: "imaginative, distinctive, story-driven",
    accessories: "one signature prop or costume detail",
    avoid: "generic pose, flat lighting, watermark, text",
  },
};

const DEFAULT_INTENT: AvatarIntent = {
  mode: "text",
  goal: "professional-profile",
  likeness: "medium",
  creativity: "medium",
  composition: "headshot",
  background: "studio",
  size: DEFAULT_IMAGE_SIZE,
};

function pickEnum<T extends string>(
  values: readonly T[],
  value: unknown,
  fallback: T,
): T {
  return typeof value === "string" && values.includes(value as T)
    ? (value as T)
    : fallback;
}

function readText(value: unknown, maxLength = 500): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function createAvatarIntent(
  input: Partial<AvatarIntent> & { mode: GenerationMode },
): AvatarIntent {
  const goal = input.goal ?? DEFAULT_INTENT.goal;
  const preset = GOAL_PRESETS[goal];

  return {
    ...DEFAULT_INTENT,
    ...preset,
    ...input,
    styleId: input.styleId ?? preset.styleId,
    subjectDescription: readText(input.subjectDescription),
    palette: readText(input.palette),
    mood: readText(input.mood),
    accessories: readText(input.accessories),
    avoid: readText(input.avoid),
    size: input.size ?? DEFAULT_IMAGE_SIZE,
  };
}

export function normalizeAvatarIntent(
  raw: unknown,
  fallback: AvatarIntent,
): AvatarIntent {
  if (!isRecord(raw)) return fallback;

  const mode = pickEnum(GENERATION_MODES, raw.mode, fallback.mode);
  const goal = pickEnum(AVATAR_GOALS, raw.goal, fallback.goal);
  const preset = GOAL_PRESETS[goal];

  return createAvatarIntent({
    mode,
    goal,
    styleId: readText(raw.styleId, 80) ?? fallback.styleId ?? preset.styleId,
    themeId: readText(raw.themeId, 80) ?? fallback.themeId,
    variantId: readText(raw.variantId, 80) ?? fallback.variantId,
    subjectDescription:
      readText(raw.subjectDescription) ?? fallback.subjectDescription,
    likeness: pickEnum(INTENT_LEVELS, raw.likeness, fallback.likeness),
    creativity: pickEnum(INTENT_LEVELS, raw.creativity, fallback.creativity),
    composition: pickEnum(
      AVATAR_COMPOSITIONS,
      raw.composition,
      fallback.composition,
    ),
    background: pickEnum(
      AVATAR_BACKGROUNDS,
      raw.background,
      fallback.background,
    ),
    palette: readText(raw.palette) ?? fallback.palette,
    mood: readText(raw.mood) ?? fallback.mood,
    accessories: readText(raw.accessories) ?? fallback.accessories,
    avoid: readText(raw.avoid) ?? fallback.avoid,
    pairedConsistency:
      typeof raw.pairedConsistency === "boolean"
        ? raw.pairedConsistency
        : fallback.pairedConsistency,
    sameFrame:
      typeof raw.sameFrame === "boolean"
        ? raw.sameFrame
        : fallback.sameFrame,
    variation:
      typeof raw.variation === "boolean" ? raw.variation : fallback.variation,
    size: pickEnum(IMAGE_SIZES, raw.size, fallback.size),
  });
}

export function parseAvatarIntentJson(
  value: string | undefined,
  fallback: AvatarIntent,
): AvatarIntent {
  if (!value) return fallback;
  try {
    return normalizeAvatarIntent(JSON.parse(value) as unknown, fallback);
  } catch {
    return fallback;
  }
}

/**
 * Couple modes normally render an A/B pair (two provider calls). Same-frame
 * places both partners in one image (one call). Same-frame is only supported for
 * the text-driven `couple-text` mode today; photo `couple` same-frame is gated
 * behind a real multi-image capability bit (Epic 10.4).
 */
export function isSameFrameCouple(intent: AvatarIntent): boolean {
  return intent.mode === "couple-text" && intent.sameFrame === true;
}

/**
 * Number of provider generations an intent triggers. Single source of truth for
 * the pre-generate call count shown by the cost surface (Epic 10.2) and the
 * plan preview (Epic 10.3).
 */
export function generationCountForIntent(intent: AvatarIntent): number {
  return isCoupleMode(intent.mode) && !isSameFrameCouple(intent) ? 2 : 1;
}

export function applyGoalPreset(
  intent: AvatarIntent,
  goal: AvatarGoal,
): AvatarIntent {
  const preset = GOAL_PRESETS[goal];
  return createAvatarIntent({
    ...intent,
    ...preset,
    goal,
    mode: intent.mode,
    themeId: intent.themeId,
    variantId: intent.variantId,
    pairedConsistency: intent.pairedConsistency,
    size: intent.size,
  });
}

function appendAvoid(current: string | undefined, next: string): string {
  return current ? `${current}, ${next}` : next;
}

export function applyRefinementAction(
  intent: AvatarIntent,
  action: RefinementAction,
): AvatarIntent {
  switch (action) {
    case "closer-likeness":
      return createAvatarIntent({
        ...intent,
        likeness: "high",
        creativity: "low",
        avoid: appendAvoid(
          intent.avoid,
          "identity drift, changed facial structure",
        ),
      });
    case "more-realistic":
      return createAvatarIntent({
        ...intent,
        styleId: "professional-headshot",
        creativity: "low",
        mood: "natural, realistic, credible portrait",
        avoid: appendAvoid(intent.avoid, "cartoon exaggeration, plastic skin"),
      });
    case "more-cute":
      return createAvatarIntent({
        ...intent,
        creativity: "high",
        mood: "cute, friendly, playful, charming",
        palette: intent.palette ?? "soft cheerful colors",
      });
    case "cleaner-background":
      return createAvatarIntent({
        ...intent,
        background: "plain",
        avoid: appendAvoid(intent.avoid, "busy background, clutter, text"),
      });
    case "variation":
      return createAvatarIntent({
        ...intent,
        variation: true,
        creativity: intent.creativity === "low" ? "medium" : "high",
      });
  }
}
