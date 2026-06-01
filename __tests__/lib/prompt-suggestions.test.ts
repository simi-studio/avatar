import { describe, expect, it } from "vitest";

import {
  PROMPT_SUGGESTIONS,
  getPromptSuggestions,
} from "@/lib/prompt-suggestions";
import { PROVIDERS } from "@/lib/constants";

describe("prompt suggestions", () => {
  it("provides starter prompts for every provider", () => {
    for (const provider of PROVIDERS) {
      const suggestions = getPromptSuggestions(provider);
      expect(suggestions.length).toBeGreaterThan(0);
      for (const suggestion of suggestions) {
        expect(suggestion.id).toBeTruthy();
        expect(suggestion.text.length).toBeGreaterThan(10);
      }
    }
  });

  it("uses unique ids within each provider", () => {
    for (const provider of PROVIDERS) {
      const ids = getPromptSuggestions(provider).map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("never embeds key-like content in a suggestion", () => {
    const all = Object.values(PROMPT_SUGGESTIONS).flat();
    for (const suggestion of all) {
      expect(suggestion.text.toLowerCase()).not.toMatch(
        /api[-_ ]?key|secret|token|password/,
      );
    }
  });

  it("adds goal and style-aware suggestions when context is available", () => {
    const suggestions = getPromptSuggestions({
      provider: "openai",
      mode: "text",
      goal: "professional-profile",
      styleId: "professional-headshot",
    });
    expect(suggestions[0]?.id).toBe("goal-professional-profile");
    expect(
      suggestions.some(
        (suggestion) => suggestion.id === "style-professional-headshot",
      ),
    ).toBe(true);
  });
});
