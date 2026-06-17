import { describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import { PROVIDERS } from "@/lib/constants";
import {
  compileAvatarPrompt,
  type CompiledProviderRequest,
} from "@/lib/prompt-compiler";
import { getStyleById } from "@/styles/avatar-styles";

/**
 * The compiled-prompt panel surfaces the request to the user, so it must be
 * structurally impossible for the stored API key to appear in it. The compiler
 * only receives the avatar intent + style/theme, never the key.
 */
describe("compiled prompt safety", () => {
  const ALLOWED_KEYS = new Set<keyof CompiledProviderRequest>([
    "provider",
    "prompt",
    "negativePrompt",
    "negativePromptStrategy",
    "referenceStrength",
    "n",
  ]);

  it("never exposes a key-like field in the compiled request", () => {
    for (const provider of PROVIDERS) {
      const intent = createAvatarIntent({
        mode: "single",
        goal: "professional-profile",
        styleId: "anime",
        subjectDescription: "a friendly portrait",
      });
      const request = compileAvatarPrompt({
        provider,
        intent,
        style: getStyleById("anime"),
      });

      for (const key of Object.keys(request)) {
        expect(ALLOWED_KEYS.has(key as keyof CompiledProviderRequest)).toBe(
          true,
        );
        expect(key.toLowerCase()).not.toContain("key");
        expect(key.toLowerCase()).not.toContain("token");
        expect(key.toLowerCase()).not.toContain("secret");
      }
    }
  });

  it("produces a non-empty prompt for every provider", () => {
    for (const provider of PROVIDERS) {
      const request = compileAvatarPrompt({
        provider,
        intent: createAvatarIntent({
          mode: "text",
          goal: "social-avatar",
          styleId: "anime",
          subjectDescription: "a calm fox",
        }),
        style: getStyleById("anime"),
      });
      expect(request.prompt.length).toBeGreaterThan(0);
      expect(request.provider).toBe(provider);
    }
  });
});
