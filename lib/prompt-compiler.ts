import type { ProviderId } from "@/lib/constants";
import { isCoupleMode } from "@/lib/constants";
import type { AvatarStyle, AvatarTheme, AvatarVariant } from "@/lib/types";
import type { AvatarIntent, IntentLevel } from "@/lib/avatar-intent";
import {
  compileEditInstruction,
  type EditIntent,
} from "@/lib/edit-intent";
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
  /** Optional multi-reference role guidance (Epic 11.4). */
  referenceGuidance?: string;
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

const MINIMAX_AVATAR_CONSTRAINTS = [
  "single subject",
  "centered face",
  "clear facial identity",
  "avatar-safe crop",
  "no text",
  "no logo",
  "no watermark",
];

const MINIMAX_PAIR_CONSTRAINTS =
  "consistent pair, same framing, same light, same background family, shared palette";

function referenceStrength(level: IntentLevel): number {
  if (level === "high") return 0.85;
  if (level === "medium") return 0.65;
  return 0.35;
}

function sentence(value: string): string {
  return value.replace(/[.。]\s*$/u, "");
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
  if (intent.mode === "couple-text") {
    if (intent.sameFrame) {
      const base =
        "a single avatar showing both partners of a couple together in one frame, side by side, balanced composition";
      return intent.subjectDescription
        ? `${base}, ${intent.subjectDescription}`
        : base;
    }
    return intent.subjectDescription
      ? `one avatar of a matching couple avatar set, ${intent.subjectDescription}`
      : "one avatar of a matching couple avatar set";
  }
  return intent.subjectDescription
    ? `the uploaded portrait subject, ${intent.subjectDescription}`
    : "the uploaded portrait subject";
}

function buildAvoidList(intent: AvatarIntent): string {
  return compact([intent.avoid, ...DEFAULT_AVOID]).join(", ");
}

function photoIdentityLines(intent: AvatarIntent): string[] {
  const highLikeness = intent.likeness === "high";
  return compact([
    `Preserve the person's identity: ${LIKENESS_TEXT[intent.likeness]}`,
    highLikeness
      ? "Do not invent a different person. Preserve face shape, eye spacing, nose, mouth, jawline, hairline, hairstyle, skin tone, and age from the reference"
      : "Keep face shape, expression, hairstyle, skin tone, and distinctive facial features recognizable unless the user explicitly asks otherwise",
    highLikeness
      ? "Change only rendering style, lighting treatment, and background as requested; keep clothing geometry unless the style truly requires otherwise"
      : undefined,
  ]);
}

function creativityLine(intent: AvatarIntent, isPhotoInput: boolean): string {
  // Multimodal probes: medium/high creativity language fights high-likeness photo identity.
  if (isPhotoInput && intent.likeness === "high") {
    return "Keep the visual treatment restrained so identity is not redesigned";
  }
  return CREATIVITY_TEXT[intent.creativity];
}

function coupleSeparationLine(intent: AvatarIntent): string | undefined {
  if (!isCoupleMode(intent.mode)) return undefined;
  if (intent.sameFrame) {
    return "Both people must remain distinct and unblended with equal visual weight side by side; preserve each identity separately and keep clothing colors correct";
  }
  if (intent.pairedConsistency) {
    return "Keep palette, lighting, background, and composition consistent across both avatars without blending identities";
  }
  return undefined;
}

function openAIPrompt(input: CompileAvatarPromptInput): string {
  const { provider, intent, style } = input;
  const profile = getProviderPromptProfile(provider);
  const calibration = getStyleCalibration(provider, intent.styleId);
  const subject = buildSubject(input);
  const styleFragment = calibration?.promptFragment ?? style?.promptTemplate;
  const avoid = buildAvoidList(intent);
  const isPhotoInput = intent.mode === "single" || intent.mode === "couple";

  const lines = compact([
    `Create ${GOAL_TEXT[intent.goal]} based on ${subject}`,
    styleFragment,
    input.referenceGuidance,
    `Output: square avatar, ${COMPOSITION_TEXT[intent.composition]}, ${BACKGROUND_TEXT[intent.background]}`,
    "Keep the subject centered with an avatar-safe crop and clear face visibility",
    intent.palette ? `Use this color palette: ${intent.palette}` : undefined,
    intent.mood ? `The mood should feel ${intent.mood}` : undefined,
    intent.accessories ? `Include ${intent.accessories}` : undefined,
    ...(isPhotoInput ? photoIdentityLines(intent) : []),
    creativityLine(intent, isPhotoInput),
    coupleSeparationLine(intent),
    intent.variation
      ? "Generate a fresh variation that keeps the same intent but changes non-essential visual details."
      : undefined,
    profile.qualityFragment,
    "Do not add text, logos, or watermarks",
    `Avoid: ${avoid}`,
  ]);

  return lines.map(sentence).join(". ");
}

function miniMaxPrompt(input: CompileAvatarPromptInput): string {
  const { provider, intent, style } = input;
  const profile = getProviderPromptProfile(provider);
  const calibration = getStyleCalibration(provider, intent.styleId);
  const subject = buildSubject(input);
  const styleFragment = calibration?.promptFragment ?? style?.promptTemplate;
  const avoid = buildAvoidList(intent);
  const isPhotoInput = intent.mode === "single" || intent.mode === "couple";
  const highPhoto = isPhotoInput && intent.likeness === "high";

  return compact([
    GOAL_TEXT[intent.goal],
    subject,
    styleFragment,
    input.referenceGuidance,
    COMPOSITION_TEXT[intent.composition],
    BACKGROUND_TEXT[intent.background],
    intent.palette,
    intent.mood,
    intent.accessories,
    isPhotoInput ? LIKENESS_TEXT[intent.likeness] : undefined,
    highPhoto
      ? "do not invent a different person, preserve face geometry and hairstyle"
      : undefined,
    highPhoto
      ? "restrained treatment, identity first"
      : CREATIVITY_TEXT[intent.creativity],
    intent.sameFrame
      ? "two distinct people, no identity blend, equal visual weight, correct clothing colors"
      : isCoupleMode(intent.mode) && intent.pairedConsistency
        ? MINIMAX_PAIR_CONSTRAINTS
        : undefined,
    intent.variation ? "fresh variation, same intent" : undefined,
    ...MINIMAX_AVATAR_CONSTRAINTS,
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

/**
 * Dedicated compiler for selected-result image edits (Epic 11.3).
 * Does not inject goal/style/creativity/background intent language — multimodal
 * probes showed those redesign cues dilute change/preserve constraints.
 */
export function compileEditPrompt(input: {
  provider: ProviderId;
  editIntent: EditIntent;
}): CompiledProviderRequest {
  const profile = getProviderPromptProfile(input.provider);
  const prompt = compileEditInstruction(input.editIntent);
  const negativePrompt = DEFAULT_AVOID.join(", ");

  if (profile.promptStyle === "comma-separated") {
    // MiniMax-style adapters prefer compact descriptors over long prose.
    const compact = [
      "edit existing avatar image only",
      `change: ${input.editIntent.change.join("; ")}`,
      `preserve: ${input.editIntent.preserve.join("; ")}`,
      "source image is ground truth",
      "no redesign of unrelated details",
      "no re-crop",
      "no new accessories",
      "no text",
      "no logo",
      "no watermark",
      profile.qualityFragment,
    ]
      .filter(Boolean)
      .join(", ");
    return {
      provider: input.provider,
      prompt: compact,
      negativePrompt: profile.supportsNativeNegativePrompt
        ? negativePrompt
        : undefined,
      negativePromptStrategy: profile.negativePromptStrategy,
      referenceStrength: 0.95,
      n: 1,
    };
  }

  return {
    provider: input.provider,
    prompt: `${prompt} Do not add text, logos, or watermarks. Avoid: ${negativePrompt}.`,
    negativePrompt: profile.supportsNativeNegativePrompt
      ? negativePrompt
      : undefined,
    negativePromptStrategy: profile.negativePromptStrategy,
    referenceStrength: 0.95,
    n: 1,
  };
}
