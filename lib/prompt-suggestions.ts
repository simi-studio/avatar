import type { GenerationMode, ProviderId } from "@/lib/constants";
import type { AvatarGoal } from "@/lib/avatar-intent";
import { getStyleCalibration } from "@/lib/provider-calibration";

/**
 * A best-practice example prompt for text-to-avatar generation. The `text` is
 * the editable prompt content sent to the provider, so it stays in English
 * (image models follow English prompts most reliably). The short `label` is
 * resolved for display via the `Suggestions` i18n namespace using `id`.
 */
export type PromptSuggestion = {
  id: string;
  labelKey?: string;
  /** English prompt content the user can insert and edit. */
  text: string;
};

export type PromptSuggestionInput = {
  provider: ProviderId;
  mode?: GenerationMode;
  styleId?: string;
  goal?: AvatarGoal;
};

/**
 * Provider-tuned starter prompts. OpenAI gpt-image-1 responds best to rich,
 * natural-language scene descriptions; MiniMax image-01 favours concise,
 * comma-separated descriptors. These give users a high-quality starting point
 * they can insert and refine instead of facing an empty box.
 */
export const PROMPT_SUGGESTIONS: Record<ProviderId, PromptSuggestion[]> = {
  openai: [
    {
      id: "friendly-professional",
      text: "A friendly professional headshot of a person with a warm, confident smile, soft studio lighting, clean neutral background, looking directly at the camera",
    },
    {
      id: "creative-portrait",
      text: "A creative portrait of a young artist with expressive eyes, colorful soft-focus background, gentle rim lighting, shallow depth of field",
    },
    {
      id: "outdoor-natural",
      text: "A natural outdoor portrait at golden hour, warm sunlight, soft bokeh of green foliage behind, relaxed and approachable expression",
    },
    {
      id: "bold-editorial",
      text: "A bold editorial fashion portrait with dramatic side lighting, deep shadows, minimal dark background, strong confident gaze",
    },
  ],
  minimax: [
    {
      id: "clean-headshot",
      text: "professional headshot, warm smile, soft studio lighting, neutral background, sharp focus, high detail",
    },
    {
      id: "anime-vibe",
      text: "anime portrait, expressive eyes, vivid colors, clean line art, soft gradient background",
    },
    {
      id: "cinematic",
      text: "cinematic portrait, dramatic lighting, shallow depth of field, moody background, film grain",
    },
    {
      id: "pastel-soft",
      text: "soft pastel portrait, gentle lighting, dreamy bokeh, delicate colors, friendly expression",
    },
  ],
};

const GOAL_PROMPT_SUGGESTIONS: Record<
  ProviderId,
  Record<AvatarGoal, PromptSuggestion>
> = {
  openai: {
    "professional-profile": {
      id: "goal-professional-profile",
      labelKey: "goal-professional-profile",
      text: "A polished professional profile avatar with a confident warm expression, realistic studio lighting, clean background, trustworthy and approachable",
    },
    "social-avatar": {
      id: "goal-social-avatar",
      labelKey: "goal-social-avatar",
      text: "A memorable social avatar with a friendly expression, bright balanced colors, simple background, expressive but natural portrait composition",
    },
    "team-character": {
      id: "goal-team-character",
      labelKey: "goal-team-character",
      text: "A cohesive team character avatar with warm expression, clean shared visual style, simple background, playful but professional energy",
    },
    character: {
      id: "goal-character",
      labelKey: "goal-character",
      text: "A distinctive character avatar with cinematic mood, one signature accessory, readable silhouette, expressive face, high-quality portrait detail",
    },
  },
  minimax: {
    "professional-profile": {
      id: "goal-professional-profile",
      labelKey: "goal-professional-profile",
      text: "professional profile avatar, confident warm expression, realistic studio lighting, clean background, trustworthy, approachable",
    },
    "social-avatar": {
      id: "goal-social-avatar",
      labelKey: "goal-social-avatar",
      text: "social avatar, friendly expression, bright balanced colors, simple background, expressive natural portrait",
    },
    "team-character": {
      id: "goal-team-character",
      labelKey: "goal-team-character",
      text: "team character avatar, cohesive visual style, warm expression, simple background, playful professional energy",
    },
    character: {
      id: "goal-character",
      labelKey: "goal-character",
      text: "character avatar, cinematic mood, signature accessory, readable silhouette, expressive face, high detail",
    },
  },
};

/** Return the starter prompts tuned for the given provider. */
export function getPromptSuggestions(
  input: ProviderId | PromptSuggestionInput,
): PromptSuggestion[] {
  const provider = typeof input === "string" ? input : input.provider;
  const goal = typeof input === "string" ? undefined : input.goal;
  const styleId = typeof input === "string" ? undefined : input.styleId;
  const mode = typeof input === "string" ? undefined : input.mode;
  const base = PROMPT_SUGGESTIONS[provider] ?? [];
  const goalSuggestion = goal
    ? GOAL_PROMPT_SUGGESTIONS[provider][goal]
    : undefined;
  const calibration = getStyleCalibration(provider, styleId);
  const styleSuggestion = calibration
    ? {
        id: `style-${calibration.styleId}`,
        labelKey: "selected-style",
        text:
          provider === "openai"
            ? `Use this calibrated style direction: ${calibration.promptFragment}. ${calibration.recoveryHint}`
            : `${calibration.promptFragment}, ${calibration.recoveryHint}`,
      }
    : undefined;

  if (!goalSuggestion && !styleSuggestion) return base;

  return [
    goalSuggestion,
    styleSuggestion,
    ...base.filter((suggestion) =>
      mode === "themed" ? suggestion.id !== "outdoor-natural" : true,
    ),
  ]
    .filter((suggestion): suggestion is PromptSuggestion => Boolean(suggestion))
    .slice(0, 4);
}
