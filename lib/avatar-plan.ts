import {
  generationCountForIntent,
  isSameFrameCouple,
  type AvatarBackground,
  type AvatarComposition,
  type AvatarGoal,
  type AvatarIntent,
  type IntentLevel,
} from "@/lib/avatar-intent";
import { isCoupleMode, isPhotoMode, type GenerationMode } from "@/lib/constants";
import type { AvatarStyle, AvatarTheme, AvatarVariant } from "@/lib/types";

/**
 * Read-only "avatar plan" derived from the current intent (Epic 10.3). It is a
 * pure function of the intent plus the resolved style/theme metadata, so by
 * construction it holds no API key, no uploaded image, and no provider response
 * — only settings the user can already see and edit.
 */

/** Stable risk codes; the UI localizes them via the `Plan.risk.*` namespace. */
export const AVATAR_PLAN_RISKS = [
  "likeness-without-photo",
  "creativity-vs-professional",
  "transparent-approximate",
  "pair-consistency",
  "same-frame-blend",
] as const;
export type AvatarPlanRisk = (typeof AVATAR_PLAN_RISKS)[number];

export type AvatarPlan = {
  mode: GenerationMode;
  goal: AvatarGoal;
  styleId?: string;
  themeId?: string;
  variantId?: string;
  composition: AvatarComposition;
  background: AvatarBackground;
  likeness: IntentLevel;
  creativity: IntentLevel;
  generationCount: number;
  risks: AvatarPlanRisk[];
};

export type AvatarPlanRefs = {
  style?: AvatarStyle;
  theme?: AvatarTheme;
  variant?: AvatarVariant;
};

function deriveRisks(intent: AvatarIntent): AvatarPlanRisk[] {
  const risks: AvatarPlanRisk[] = [];
  // High likeness only means something when a real photo anchors the face.
  if (!isPhotoMode(intent.mode) && intent.likeness === "high") {
    risks.push("likeness-without-photo");
  }
  if (intent.goal === "professional-profile" && intent.creativity === "high") {
    risks.push("creativity-vs-professional");
  }
  if (intent.background === "transparent-like") {
    risks.push("transparent-approximate");
  }
  if (isCoupleMode(intent.mode) && !isSameFrameCouple(intent)) {
    risks.push("pair-consistency");
  }
  if (isSameFrameCouple(intent)) {
    risks.push("same-frame-blend");
  }
  return risks;
}

export function deriveAvatarPlan(
  intent: AvatarIntent,
  refs: AvatarPlanRefs = {},
): AvatarPlan {
  const themed = intent.mode === "themed";
  return {
    mode: intent.mode,
    goal: intent.goal,
    styleId: themed ? undefined : (refs.style?.id ?? intent.styleId),
    themeId: themed ? (refs.theme?.id ?? intent.themeId) : undefined,
    variantId: themed ? (refs.variant?.id ?? intent.variantId) : undefined,
    composition: intent.composition,
    background: intent.background,
    likeness: intent.likeness,
    creativity: intent.creativity,
    generationCount: generationCountForIntent(intent),
    risks: deriveRisks(intent),
  };
}
