import { describe, expect, it } from "vitest";

import {
  defaultLocale,
  isSupportedLocale,
  locales,
} from "@/i18n/routing";

describe("i18n routing", () => {
  it("defaults to English", () => {
    expect(defaultLocale).toBe("en");
  });

  it("supports English and Simplified Chinese", () => {
    expect(locales).toContain("en");
    expect(locales).toContain("zh-CN");
  });

  it("recognizes supported locales", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("zh-CN")).toBe(true);
  });

  it("rejects unsupported or invalid locales", () => {
    expect(isSupportedLocale("fr")).toBe(false);
    expect(isSupportedLocale("")).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
    expect(isSupportedLocale(42)).toBe(false);
  });
});
