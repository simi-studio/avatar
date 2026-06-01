import { describe, expect, it } from "vitest";

import en from "@/i18n/en.json";
import zhCN from "@/i18n/zh-CN.json";

/** Collect every dotted key path from a nested message object. */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(
    ([key, value]) => keyPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n catalogs", () => {
  it("en and zh-CN expose identical key sets", () => {
    const enKeys = keyPaths(en).sort();
    const zhKeys = keyPaths(zhCN).sort();

    const missingInZh = enKeys.filter((k) => !zhKeys.includes(k));
    const missingInEn = zhKeys.filter((k) => !enKeys.includes(k));

    expect(missingInZh).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it("has no empty string values", () => {
    for (const [name, catalog] of [
      ["en", en],
      ["zh-CN", zhCN],
    ] as const) {
      const paths = keyPaths(catalog);
      const get = (path: string): unknown =>
        path
          .split(".")
          .reduce<unknown>(
            (acc, key) =>
              typeof acc === "object" && acc !== null
                ? (acc as Record<string, unknown>)[key]
                : undefined,
            catalog,
          );
      for (const path of paths) {
        const value = get(path);
        expect(value, `${name}:${path}`).not.toBe("");
      }
    }
  });
});
