import {
  applyGoalPreset,
  applyRefinementAction,
  createAvatarIntent,
  type AvatarBackground,
  type AvatarComposition,
  type AvatarGoal,
  type AvatarIntent,
  type IntentLevel,
  type RefinementAction,
} from "@/lib/avatar-intent";

/**
 * Deterministic free-text → intent mapping (Epic 10.3). This is the missing
 * "front half" of the intent-first flow: it turns a short human brief into an
 * editable {@link AvatarIntent} using a keyword table, with **no** network or
 * LLM call. LLM extraction is intentionally out of scope (D17); everything here
 * is a pure, fully testable function.
 */

/** Signals a brief can express. Every field is optional and best-effort. */
export type BriefSignals = {
  goal?: AvatarGoal;
  styleId?: string;
  composition?: AvatarComposition;
  background?: AvatarBackground;
  likeness?: IntentLevel;
  creativity?: IntentLevel;
  /** A recognized one-shot refinement, used by natural-language refinement. */
  action?: RefinementAction;
};

type Rule<T> = readonly [keywords: readonly string[], value: T];

/** Return the value of the first rule whose any keyword appears in `text`. */
function firstMatch<T>(text: string, rules: readonly Rule<T>[]): T | undefined {
  for (const [keywords, value] of rules) {
    if (keywords.some((keyword) => text.includes(keyword))) return value;
  }
  return undefined;
}

const GOAL_RULES: readonly Rule<AvatarGoal>[] = [
  [
    ["linkedin", "professional", "headshot", "resume", "cv", "corporate", "business", "profile photo", "profile picture"],
    "professional-profile",
  ],
  [
    ["team", "mascot", "brand character", "company character"],
    "team-character",
  ],
  [
    ["fantasy", "hero", "warrior", "knight", "mage", "rpg", "game character", "character"],
    "character",
  ],
  [
    ["social", "avatar", "profile pic", "pfp", "gaming", "discord", "twitter", "instagram"],
    "social-avatar",
  ],
];

const STYLE_RULES: readonly Rule<string>[] = [
  [["anime"], "anime"],
  [["pixar", "3d"], "pixar-3d"],
  [["cyberpunk", "neon"], "cyberpunk"],
  [["linkedin"], "linkedin"],
  [["professional headshot", "corporate headshot"], "professional-headshot"],
  [["comic"], "comic-book"],
  [["watercolor", "water color"], "watercolor"],
  [["pixel", "8-bit", "16-bit", "retro game"], "retro-game"],
  [["sci-fi", "scifi", "science fiction"], "sci-fi"],
  [["fantasy", "hero", "knight", "warrior", "mage"], "fantasy-hero"],
];

const COMPOSITION_RULES: readonly Rule<AvatarComposition>[] = [
  [["full body", "full-body", "whole body", "head to toe"], "full-body"],
  [["half body", "half-body", "waist up", "waist-up"], "half-body"],
  [["headshot", "close up", "close-up", "face", "portrait"], "headshot"],
];

const BACKGROUND_RULES: readonly Rule<AvatarBackground>[] = [
  [["transparent", "cutout", "cut out", "no background"], "transparent-like"],
  [["studio"], "studio"],
  [["outdoor", "city", "nature", "landscape", "scene", "street"], "scene"],
  [["plain", "solid", "simple background", "blank"], "plain"],
];

const LIKENESS_RULES: readonly Rule<IntentLevel>[] = [
  [["like me", "looks like me", "look like me", "my face", "resemble", "same face", "keep my"], "high"],
];

const CREATIVITY_RULES: readonly Rule<IntentLevel>[] = [
  [["realistic", "natural", "true to life", "photoreal", "lifelike"], "low"],
  [["creative", "artistic", "imaginative", "wild", "stylized", "surreal"], "high"],
];

const ACTION_RULES: readonly Rule<RefinementAction>[] = [
  [["more like me", "closer to me", "look like me", "my face", "accurate face", "closer likeness"], "closer-likeness"],
  [["more realistic", "less cartoon", "photo", "photoreal", "true to life"], "more-realistic"],
  [["cute", "cuter", "adorable", "kawaii"], "more-cute"],
  [["clean background", "cleaner background", "plain background", "simple background", "remove background"], "cleaner-background"],
  [["variation", "different", "another", "vary", "alternative", "something else"], "variation"],
];

/** Map lowercased brief text to structured signals. Pure and side-effect free. */
export function matchBriefSignals(input: string): BriefSignals {
  const text = input.toLowerCase();
  return {
    goal: firstMatch(text, GOAL_RULES),
    styleId: firstMatch(text, STYLE_RULES),
    composition: firstMatch(text, COMPOSITION_RULES),
    background: firstMatch(text, BACKGROUND_RULES),
    likeness: firstMatch(text, LIKENESS_RULES),
    creativity: firstMatch(text, CREATIVITY_RULES),
    action: firstMatch(text, ACTION_RULES),
  };
}

/** Overlay structured signals (except `action`) onto a base intent. */
function applySignals(base: AvatarIntent, signals: BriefSignals): AvatarIntent {
  const withGoal = signals.goal ? applyGoalPreset(base, signals.goal) : base;
  return createAvatarIntent({
    ...withGoal,
    mode: base.mode,
    themeId: base.themeId,
    variantId: base.variantId,
    size: base.size,
    pairedConsistency: base.pairedConsistency,
    sameFrame: base.sameFrame,
    styleId: signals.styleId ?? withGoal.styleId,
    composition: signals.composition ?? withGoal.composition,
    background: signals.background ?? withGoal.background,
    likeness: signals.likeness ?? withGoal.likeness,
    creativity: signals.creativity ?? withGoal.creativity,
  });
}

/**
 * Build an editable intent from a free-text brief. The brief also becomes the
 * subject description, so nothing the user typed is lost even when a phrase is
 * not recognized.
 */
export function parseBriefToIntent(
  base: AvatarIntent,
  brief: string,
): AvatarIntent {
  const description = brief.trim();
  const next = applySignals(base, matchBriefSignals(brief));
  return createAvatarIntent({
    ...next,
    subjectDescription: description || next.subjectDescription,
  });
}

/**
 * Apply one natural-language refinement to an existing intent. It resolves to a
 * single intent transform so the caller makes exactly one provider call,
 * consistent with the Epic 10.2 re-call notice.
 */
export function applyBriefRefinement(
  intent: AvatarIntent,
  text: string,
): AvatarIntent {
  const signals = matchBriefSignals(text);

  // Prefer an explicit action so NL refinement reuses the button transform path.
  if (signals.action) {
    return applyRefinementAction(intent, signals.action);
  }

  // Otherwise layer any recognized goal/style/framing signals as one delta.
  const hasStructuralSignal =
    signals.goal !== undefined ||
    signals.styleId !== undefined ||
    signals.composition !== undefined ||
    signals.background !== undefined ||
    signals.likeness !== undefined ||
    signals.creativity !== undefined;
  if (hasStructuralSignal) {
    return applySignals(intent, signals);
  }

  // No recognizable signal: fold the note into the description so it still
  // shapes the prompt, without silently changing structured controls.
  const note = text.trim();
  if (!note) return intent;
  const subjectDescription = intent.subjectDescription
    ? `${intent.subjectDescription}, ${note}`
    : note;
  return createAvatarIntent({ ...intent, subjectDescription });
}
