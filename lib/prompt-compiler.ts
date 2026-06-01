import type { ProviderId } from "@/lib/constants";
import type { AvatarStyle, AvatarTheme, AvatarVariant } from "@/lib/types";
import type { AvatarIntent, IntentLevel } from "@/lib/avatar-intent";
import {
  getProviderPromptProfile,
  getStyleCalibration,
} from "@/lib/provider-calibration";

export type CompiledProviderRequest = {
  provider: ProviderId;
  prompt: string;
  negativePrompt?: string;
  negativePromptStrategy: "native" | "soft-prompt";
  referenceStrength?: number;
  n: 1;
};

export type CompileAvatarPromptInput = {
  provider: ProviderId;
  intent: AvatarIntent;
  style?: AvatarStyle;
  theme?: AvatarTheme;
  variant?: AvatarVariant;
};

const LIKENESS_TEXT: Record<IntentLevel, string> = {
  low: "Use the source as loose inspiration; stylization may be bold.",
  medium: "Preserve the main facial identity while allowing clear stylization.",
  high: "Preserve facial identity closely, including face shape, expression, and distinctive features.",
};

const CREATIVITY_TEXT: Record<IntentLevel, string> = {
  low: "Keep the result realistic and restrained.",
  medium: "Balance accurate intent with tasteful creative interpretation.",
  high: "Allow a more imaginative avatar treatment while keeping the result usable.",
};

const COMPOSITION_TEXT: Record<AvatarIntent["composition"], string> = {
  headshot: "head-and-shoulders avatar composition",
  "half-body": "half-body avatar composition",
  "full-body": "full-body character avatar composition",
};

const BACKGROUND_TEXT: Record<AvatarIntent["background"], string> = {
  plain: "clean plain background",
  studio: "soft studio background",
  scene: "simple contextual scene background",
  "transparent-like":
    "transparent-like isolated subject on a clean light backdrop",
};

const GOAL_TEXT: Record<AvatarIntent["goal"], string> = {
  "professional-profile": "professional profile avatar",
  "social-avatar": "memorable social avatar",
  "team-character": "cohesive team character avatar",
  character: "distinctive character avatar",
};

const DEFAULT_AVOID = [
  "watermark",
  "logo",
  "text in image",
  "extra fingers",
  "distorted hands",
  "warped face",
];

function referenceStrength(level: IntentLevel): number {
  if (level === "high") return 0.85;
  if (level === "medium") return 0.65;
  return 0.35;
}

function compact(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value));
}

function buildSubject(input: CompileAvatarPromptInput): string {
  const { intent, theme, variant } = input;
  if (intent.mode === "themed") {
    return compact([
      theme?.basePrompt,
      variant?.promptFragment,
      intent.subjectDescription,
    ]).join(", ");
  }
  if (intent.mode === "text") {
    return intent.subjectDescription ?? "a friendly portrait avatar";
  }
  return intent.subjectDescription
    ? `the uploaded portrait subject, ${intent.subjectDescription}`
    : "the uploaded portrait subject";
}

function buildAvoidList(intent: AvatarIntent): string {
  return compact([intent.avoid, ...DEFAULT_AVOID]).join(", ");
}

function openAIPrompt(input: CompileAvatarPromptInput): string {
  const { provider, intent, style } = input;
  const profile = getProviderPromptProfile(provider);
  const calibration = getStyleCalibration(provider, intent.styleId);
  const subject = buildSubject(input);
  const styleFragment = calibration?.promptFragment ?? style?.promptTemplate;
  const avoid = buildAvoidList(intent);

  return compact([
    `Create ${GOAL_TEXT[intent.goal]} based on ${subject}`,
    styleFragment,
    COMPOSITION_TEXT[intent.composition],
    BACKGROUND_TEXT[intent.background],
    intent.palette ? `Use this color palette: ${intent.palette}` : undefined,
    intent.mood ? `The mood should feel ${intent.mood}` : undefined,
    intent.accessories ? `Include ${intent.accessories}` : undefined,
    intent.mode === "single" || intent.mode === "couple"
      ? LIKENESS_TEXT[intent.likeness]
      : undefined,
    CREATIVITY_TEXT[intent.creativity],
    intent.mode === "couple" && intent.pairedConsistency
      ? "Keep palette, lighting, background, and composition consistent across both avatars."
      : undefined,
    intent.variation
      ? "Generate a fresh variation that keeps the same intent but changes non-essential visual details."
      : undefined,
    profile.qualityFragment,
    `Avoid: ${avoid}`,
  ]).join(". ");
}

function miniMaxPrompt(input: CompileAvatarPromptInput): string {
  const { provider, intent, style } = input;
  const profile = getProviderPromptProfile(provider);
  const calibration = getStyleCalibration(provider, intent.styleId);
  const subject = buildSubject(input);
  const styleFragment = calibration?.promptFragment ?? style?.promptTemplate;
  const avoid = buildAvoidList(intent);

  return compact([
    GOAL_TEXT[intent.goal],
    subject,
    styleFragment,
    COMPOSITION_TEXT[intent.composition],
    BACKGROUND_TEXT[intent.background],
    intent.palette,
    intent.mood,
    intent.accessories,
    intent.mode === "single" || intent.mode === "couple"
      ? LIKENESS_TEXT[intent.likeness]
      : undefined,
    CREATIVITY_TEXT[intent.creativity],
    intent.mode === "couple" && intent.pairedConsistency
      ? "consistent pair, shared lighting, shared background, shared palette"
      : undefined,
    intent.variation ? "fresh variation, same intent" : undefined,
    profile.qualityFragment,
    `avoid ${avoid}`,
  ]).join(", ");
}

export function compileAvatarPrompt(
  input: CompileAvatarPromptInput,
): CompiledProviderRequest {
  const profile = getProviderPromptProfile(input.provider);
  const negativePrompt = buildAvoidList(input.intent);
  const prompt =
    profile.promptStyle === "natural-language"
      ? openAIPrompt(input)
      : miniMaxPrompt(input);

  return {
    provider: input.provider,
    prompt,
    negativePrompt: profile.supportsNativeNegativePrompt
      ? negativePrompt
      : undefined,
    negativePromptStrategy: profile.negativePromptStrategy,
    referenceStrength:
      input.intent.mode === "single" || input.intent.mode === "couple"
        ? referenceStrength(input.intent.likeness)
        : undefined,
    n: 1,
  };
}
