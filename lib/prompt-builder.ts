import type {
  AvatarStyle,
  AvatarTheme,
  AvatarVariant,
  GenerationMode,
} from "@/lib/types";
import type { ProviderId } from "@/lib/constants";
import type { AvatarIntent } from "@/lib/avatar-intent";
import { createAvatarIntent } from "@/lib/avatar-intent";
import { compileAvatarPrompt } from "@/lib/prompt-compiler";

export type BuildPromptInput = {
  provider?: ProviderId;
  mode: GenerationMode;
  style?: AvatarStyle;
  theme?: AvatarTheme;
  variant?: AvatarVariant;
  userPrompt?: string;
  intent?: AvatarIntent;
  /** Couple mode: keep palette/background/lighting/composition consistent. */
  pairedConsistency?: boolean;
};

/**
 * Mode-aware prompt assembly (prd.md §7).
 *
 * - `text` (text-to-image): user description + chosen style template + quality,
 *   with no face reference. This is the default, lowest-friction mode.
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
  const intent =
    input.intent ??
    createAvatarIntent({
      mode: input.mode,
      styleId: input.style?.id,
      themeId: input.theme?.id,
      variantId: input.variant?.id,
      subjectDescription: userPrompt,
      pairedConsistency: input.pairedConsistency,
    });

  return compileAvatarPrompt({
    provider: input.provider ?? "openai",
    intent,
    style: input.style,
    theme: input.theme,
    variant: input.variant,
  }).prompt;
}
