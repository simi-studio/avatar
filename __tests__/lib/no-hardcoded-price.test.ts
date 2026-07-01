import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import en from "@/i18n/en.json";
import zhCN from "@/i18n/zh-CN.json";

/**
 * Cost transparency links out to each provider's official pricing page instead
 * of embedding prices, because upstream prices change and would go stale in
 * code (D18 / Epic 10.2). This guard fails if a currency-and-number literal is
 * introduced into user-facing copy or the provider capability table.
 */

// A currency symbol next to a number, or a number followed by a currency code.
const PRICE_PATTERNS: RegExp[] = [
  /[$¥€£]\s?\d/,
  /\d\s?(usd|cny|rmb|eur|gbp)\b/i,
  /\d\s?(per|\/)\s?(image|images|token|tokens|call|calls|1m|1k)\b/i,
];

function stringValues(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (typeof obj !== "object" || obj === null) return [];
  return Object.values(obj as Record<string, unknown>).flatMap(stringValues);
}

function assertNoPrice(label: string, text: string): void {
  for (const pattern of PRICE_PATTERNS) {
    expect(pattern.test(text), `${label} contains a price literal (${pattern})`).toBe(
      false,
    );
  }
}

describe("no hard-coded prices", () => {
  it("i18n catalogs embed no currency/price literal", () => {
    for (const [name, catalog] of [
      ["en", en],
      ["zh-CN", zhCN],
    ] as const) {
      for (const value of stringValues(catalog)) {
        assertNoPrice(`${name}: "${value}"`, value);
      }
    }
  });

  it("the provider capability table embeds no currency/price literal", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/provider-capabilities.ts"),
      "utf8",
    );
    assertNoPrice("lib/provider-capabilities.ts", source);
  });
});
