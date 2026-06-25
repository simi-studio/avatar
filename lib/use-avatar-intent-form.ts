"use client";

import { useCallback, useState } from "react";

import {
  DEFAULT_IMAGE_SIZE,
  type GenerationMode,
  type ImageSize,
} from "@/lib/constants";
import {
  GOAL_PRESETS,
  type AvatarBackground,
  type AvatarComposition,
  type AvatarGoal,
  type AvatarIntent,
  type IntentLevel,
} from "@/lib/avatar-intent";
import { AVATAR_STYLES } from "@/styles/avatar-styles";
import { AVATAR_THEMES } from "@/styles/avatar-themes";

const DEFAULT_GOAL: AvatarGoal = "professional-profile";
const DEFAULT_GOAL_PRESET = GOAL_PRESETS[DEFAULT_GOAL];

/**
 * Flat, raw form state for an avatar intent. Free-text fields stay as raw
 * strings (not trimmed/undefined) so controlled inputs behave normally;
 * normalization happens in `createAvatarIntent` at submit time.
 */
export type IntentForm = {
  mode: GenerationMode;
  goal: AvatarGoal;
  styleId?: string;
  themeId?: string;
  variantId?: string;
  userPrompt: string;
  likeness: IntentLevel;
  creativity: IntentLevel;
  composition: AvatarComposition;
  background: AvatarBackground;
  palette: string;
  mood: string;
  accessories: string;
  avoid: string;
  pairedConsistency: boolean;
  sameFrame: boolean;
  size: ImageSize;
};

const INITIAL_FORM: IntentForm = {
  mode: "text",
  goal: DEFAULT_GOAL,
  styleId: DEFAULT_GOAL_PRESET.styleId ?? AVATAR_STYLES[0]?.id,
  themeId: AVATAR_THEMES[0]?.id,
  variantId: undefined,
  userPrompt: "",
  likeness: DEFAULT_GOAL_PRESET.likeness,
  creativity: DEFAULT_GOAL_PRESET.creativity,
  composition: DEFAULT_GOAL_PRESET.composition,
  background: DEFAULT_GOAL_PRESET.background,
  palette: DEFAULT_GOAL_PRESET.palette ?? "",
  mood: DEFAULT_GOAL_PRESET.mood ?? "",
  accessories: DEFAULT_GOAL_PRESET.accessories ?? "",
  avoid: DEFAULT_GOAL_PRESET.avoid ?? "",
  pairedConsistency: true,
  sameFrame: false,
  size: DEFAULT_IMAGE_SIZE,
};

/**
 * Map a normalized intent (from a goal preset, refinement, or restored history
 * entry) back onto raw form fields. Optional ids only override when present, and
 * `pairedConsistency` only when explicitly set, preserving the prior behavior of
 * the per-field sync.
 */
export function formFromIntent(intent: AvatarIntent): Partial<IntentForm> {
  const patch: Partial<IntentForm> = {
    mode: intent.mode,
    goal: intent.goal,
    likeness: intent.likeness,
    creativity: intent.creativity,
    composition: intent.composition,
    background: intent.background,
    palette: intent.palette ?? "",
    mood: intent.mood ?? "",
    accessories: intent.accessories ?? "",
    avoid: intent.avoid ?? "",
    userPrompt: intent.subjectDescription ?? "",
    sameFrame: intent.sameFrame ?? false,
    size: intent.size,
  };
  if (intent.pairedConsistency !== undefined) {
    patch.pairedConsistency = intent.pairedConsistency;
  }
  if (intent.styleId) patch.styleId = intent.styleId;
  if (intent.themeId) patch.themeId = intent.themeId;
  if (intent.variantId) patch.variantId = intent.variantId;
  return patch;
}

export type AvatarIntentForm = {
  form: IntentForm;
  patch: (next: Partial<IntentForm>) => void;
};

/** Single source of truth for the avatar intent form fields. */
export function useAvatarIntentForm(): AvatarIntentForm {
  const [form, setForm] = useState<IntentForm>(INITIAL_FORM);
  const patch = useCallback((next: Partial<IntentForm>) => {
    setForm((prev) => ({ ...prev, ...next }));
  }, []);
  return { form, patch };
}
