import { describe, expect, it } from "vitest";

import { PROVIDERS } from "@/lib/constants";
import {
  getStyleCalibration,
  PROVIDER_PROMPT_PROFILES,
} from "@/lib/provider-calibration";
import { AVATAR_STYLES } from "@/styles/avatar-styles";
import { AVATAR_THEMES } from "@/styles/avatar-themes";

describe("provider calibration", () => {
  it("has prompt profiles for every provider", () => {
    for (const provider of PROVIDERS) {
      expect(PROVIDER_PROMPT_PROFILES[provider].preferredLanguage).toBe("en");
      expect(
        PROVIDER_PROMPT_PROFILES[provider].qualityFragment.length,
      ).toBeGreaterThan(20);
    }
  });

  it("calibrates every built-in style for every provider", () => {
    for (const provider of PROVIDERS) {
      for (const style of AVATAR_STYLES) {
        const calibration = getStyleCalibration(provider, style.id);
        expect(calibration?.promptFragment.length).toBeGreaterThan(20);
        expect(calibration?.knownBias.length).toBeGreaterThan(10);
        expect(calibration?.recoveryHint.length).toBeGreaterThan(10);
      }
    }
  });

  it("has self-owned preview paths for every style and theme variant", () => {
    for (const style of AVATAR_STYLES) {
      expect(style.thumbnail).toMatch(/^\/previews\/styles\/.+\.svg$/);
    }
    for (const theme of AVATAR_THEMES) {
      expect(theme.thumbnail).toMatch(/^\/previews\/themes\/.+\.svg$/);
      for (const variant of theme.variants) {
        expect(variant.thumbnail).toMatch(/^\/previews\/themes\/.+\.svg$/);
      }
    }
  });
});
