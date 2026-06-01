import type {
  AvatarStyle,
  AvatarTheme,
  AvatarVariant,
  GenerationMode,
} from "@/lib/types";

const QUALITY =
  "clean composition, high-quality details, centered portrait, sharp focus";

const PAIRED_CONSISTENCY =
  "matching color palette, background, lighting and composition so the pair looks like a cohesive set";

export type BuildPromptInput = {
  mode: GenerationMode;
  style?: AvatarStyle;
  theme?: AvatarTheme;
  variant?: AvatarVariant;
  userPrompt?: string;
  /** Couple mode: keep palette/background/lighting/composition consistent. */
  pairedConsistency?: boolean;
};

/**
 * Mode-aware prompt assembly (prd.md §7).
 *
 * - `themed` (text-to-image): theme base prompt + variant fragment + optional
 *   style + quality + user prompt, with no face reference.
 * - `single` / `couple` (image-to-image): style template + face-preservation
 *   instruction + quality + user prompt.
 *
 * `couple` uses the same prompt and style for both images to keep the pair
 * consistent.
 */
export function buildPrompt(input: BuildPromptInput): string {
  const userPrompt = input.userPrompt?.trim() || undefined;

  if (input.mode === "themed") {
    return [
      input.theme?.basePrompt,
      input.variant?.promptFragment,
      input.style?.promptTemplate,
      QUALITY,
      userPrompt,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return [
    `Transform the uploaded portrait into a ${input.style?.name ?? "stylized"} avatar.`,
    "Keep the person's main facial features recognizable.",
    QUALITY,
    input.mode === "couple" && input.pairedConsistency
      ? PAIRED_CONSISTENCY
      : undefined,
    input.style?.promptTemplate,
    userPrompt,
  ]
    .filter(Boolean)
    .join(" ");
}
