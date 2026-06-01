import type { ProviderId } from "@/lib/constants";

/**
 * A best-practice example prompt for text-to-avatar generation. The `text` is
 * the editable prompt content sent to the provider, so it stays in English
 * (image models follow English prompts most reliably). The short `label` is
 * resolved for display via the `Suggestions` i18n namespace using `id`.
 */
export type PromptSuggestion = {
  id: string;
  /** English prompt content the user can insert and edit. */
  text: string;
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

/** Return the starter prompts tuned for the given provider. */
export function getPromptSuggestions(provider: ProviderId): PromptSuggestion[] {
  return PROMPT_SUGGESTIONS[provider] ?? [];
}
