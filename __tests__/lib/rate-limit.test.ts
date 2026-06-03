import { describe, expect, it } from "vitest";

import {
  checkRateLimit,
  clientIdentifier,
  type RateLimitState,
} from "@/lib/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests when no limit is configured", () => {
    const state: RateLimitState = new Map();
    const result = checkRateLimit(state, "ip", 0);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it("allows up to the limit then blocks within the window", () => {
    const state: RateLimitState = new Map();
    const now = 1_000_000;
    expect(checkRateLimit(state, "ip", 2, now).allowed).toBe(true);
    expect(checkRateLimit(state, "ip", 2, now + 1).allowed).toBe(true);
    const blocked = checkRateLimit(state, "ip", 2, now + 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("recovers after the window passes", () => {
    const state: RateLimitState = new Map();
    const now = 1_000_000;
    checkRateLimit(state, "ip", 1, now);
    expect(checkRateLimit(state, "ip", 1, now + 100).allowed).toBe(false);
    expect(checkRateLimit(state, "ip", 1, now + 61_000).allowed).toBe(true);
  });

  it("tracks identifiers independently", () => {
    const state: RateLimitState = new Map();
    const now = 1_000_000;
    checkRateLimit(state, "a", 1, now);
    expect(checkRateLimit(state, "b", 1, now).allowed).toBe(true);
  });
});

describe("clientIdentifier", () => {
  it("prefers Cloudflare's connecting IP over spoofable forwarded headers", () => {
    const headers = new Headers({
      "cf-connecting-ip": "9.9.9.9",
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(clientIdentifier(headers)).toBe("9.9.9.9");
  });

  it("falls back to the first x-forwarded-for entry then anonymous", () => {
    expect(
      clientIdentifier(
        new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }),
      ),
    ).toBe("1.2.3.4");
    expect(clientIdentifier(new Headers())).toBe("anonymous");
  });
});
