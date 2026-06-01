import { describe, expect, it } from "vitest";

import { decodePreset, encodePreset } from "@/lib/preset";

describe("team preset codec", () => {
  it("round-trips a non-sensitive preset", () => {
    const code = encodePreset({
      mode: "themed",
      provider: "minimax",
      region: "china",
      themeId: "dogs",
      variantId: "corgi",
      pairedConsistency: false,
    });
    expect(decodePreset(code)).toEqual({
      mode: "themed",
      provider: "minimax",
      region: "china",
      themeId: "dogs",
      variantId: "corgi",
      pairedConsistency: false,
    });
  });

  it("produces a URL-safe base64url string", () => {
    const code = encodePreset({ mode: "single", styleId: "anime" });
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("never encodes credential-like fields", () => {
    const code = encodePreset({
      mode: "single",
      styleId: "anime",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiKey: "sk-super-secret",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    const decoded = JSON.parse(
      Buffer.from(
        code.replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf-8"),
    ) as Record<string, unknown>;
    expect(decoded).not.toHaveProperty("apiKey");
    expect(JSON.stringify(decoded)).not.toContain("sk-super-secret");
  });

  it("drops key-like and unknown fields on decode", () => {
    const malicious = {
      mode: "single",
      styleId: "anime",
      apiKey: "sk-leak",
      token: "abc",
      secretValue: "xyz",
      password: "p",
      authorization: "Bearer x",
      __proto__: { polluted: true },
      arbitrary: "drop-me",
    };
    const code = Buffer.from(JSON.stringify(malicious), "utf-8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const preset = decodePreset(code);
    expect(preset).toEqual({ mode: "single", styleId: "anime" });
    expect(preset).not.toHaveProperty("apiKey");
    expect(preset).not.toHaveProperty("token");
    expect(preset).not.toHaveProperty("password");
  });

  it("returns an empty preset for malformed input", () => {
    expect(decodePreset(null)).toEqual({});
    expect(decodePreset("")).toEqual({});
    expect(decodePreset("@@@not-base64@@@")).toEqual({});
    expect(decodePreset("bm90LWpzb24")).toEqual({}); // "not-json"
  });

  it("rejects invalid enum values", () => {
    const code = Buffer.from(
      JSON.stringify({ mode: "evil", provider: "stability", region: "mars" }),
      "utf-8",
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodePreset(code)).toEqual({});
  });
});
