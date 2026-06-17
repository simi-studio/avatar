import { describe, expect, it } from "vitest";

import en from "@/i18n/en.json";
import zhCN from "@/i18n/zh-CN.json";
import {
  AVATAR_THEMES,
  getThemeById,
  getVariant,
  THEME_IDS,
} from "@/styles/avatar-themes";

const enTheme = en.Theme as Record<string, string>;
const zhTheme = zhCN.Theme as Record<string, string>;

describe("avatar themes", () => {
  it("exposes the expanded theme set", () => {
    expect(THEME_IDS).toEqual(
      expect.arrayContaining(["dogs", "cats", "robots", "pixel-heroes"]),
    );
  });

  it("has unique theme ids", () => {
    const ids = AVATAR_THEMES.map((theme) => theme.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has globally unique variant ids (preset lookup is by variant id alone)", () => {
    const variantIds = AVATAR_THEMES.flatMap((theme) =>
      theme.variants.map((variant) => variant.id),
    );
    expect(new Set(variantIds).size).toBe(variantIds.length);
  });

  it("gives every theme a non-empty base prompt and at least one variant", () => {
    for (const theme of AVATAR_THEMES) {
      expect(theme.basePrompt.length).toBeGreaterThan(0);
      expect(theme.variants.length).toBeGreaterThan(0);
      for (const variant of theme.variants) {
        expect(variant.promptFragment.length).toBeGreaterThan(0);
      }
    }
  });

  it("has matching en and zh-CN labels for every theme and variant id", () => {
    for (const theme of AVATAR_THEMES) {
      expect(enTheme[theme.id], `en label for ${theme.id}`).toBeTruthy();
      expect(zhTheme[theme.id], `zh label for ${theme.id}`).toBeTruthy();
      for (const variant of theme.variants) {
        expect(enTheme[variant.id], `en label for ${variant.id}`).toBeTruthy();
        expect(zhTheme[variant.id], `zh label for ${variant.id}`).toBeTruthy();
      }
    }
  });

  it("resolves new themes and their variants", () => {
    expect(getThemeById("cats")?.name).toBe("Cats");
    expect(getVariant("robots", "mech-warrior")?.promptFragment).toContain(
      "mech",
    );
    expect(getVariant("pixel-heroes", "knight")?.name).toBe("Knight");
  });
});
