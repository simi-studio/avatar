import { describe, expect, it } from "vitest";

import { redactSecret, redactText } from "@/lib/redaction";

describe("redactSecret", () => {
  it("masks empty and short values fully", () => {
    expect(redactSecret("")).toBe("");
    expect(redactSecret(undefined)).toBe("");
    expect(redactSecret("short")).toBe("***");
  });

  it("keeps only a short, non-reversible hint", () => {
    const masked = redactSecret("sk-1234567890abcdef");
    expect(masked).toBe("sk-***ef");
    expect(masked).not.toContain("1234567890");
  });
});

describe("redactText", () => {
  it("scrubs OpenAI-style keys from text", () => {
    const text = "Auth failed for sk-abcdefghijklmnop12345 on request";
    expect(redactText(text)).not.toContain("sk-abcdefghijklmnop12345");
    expect(redactText(text)).toContain("***");
  });

  it("scrubs long opaque tokens", () => {
    const token = "a".repeat(40);
    expect(redactText(`token=${token}`)).not.toContain(token);
  });

  it("leaves ordinary text unchanged", () => {
    expect(redactText("The request was rate limited.")).toBe(
      "The request was rate limited.",
    );
  });
});
