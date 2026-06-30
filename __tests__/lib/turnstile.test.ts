// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { isTurnstileEnabled, verifyTurnstileToken } from "@/lib/turnstile";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function stubSiteVerify(success: boolean, ok = true) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ success }), {
      status: ok ? 200 : 500,
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("isTurnstileEnabled", () => {
  it("is false when the secret is unset or blank", () => {
    expect(isTurnstileEnabled()).toBe(false);
    vi.stubEnv("TURNSTILE_SECRET_KEY", "   ");
    expect(isTurnstileEnabled()).toBe(false);
  });

  it("is true when the secret is set", () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    expect(isTurnstileEnabled()).toBe(true);
  });
});

describe("verifyTurnstileToken", () => {
  it("passes without calling siteverify when disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstileToken(undefined)).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a missing token without calling siteverify when enabled", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyTurnstileToken(undefined)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a token that siteverify confirms", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = stubSiteVerify(true);
    await expect(verifyTurnstileToken("token")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      SITEVERIFY_URL,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects a token that siteverify denies", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    stubSiteVerify(false);
    await expect(verifyTurnstileToken("token")).resolves.toBe(false);
  });

  it("rejects on a non-2xx siteverify response", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    stubSiteVerify(true, false);
    await expect(verifyTurnstileToken("token")).resolves.toBe(false);
  });

  it("rejects when siteverify throws", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    await expect(verifyTurnstileToken("token")).resolves.toBe(false);
  });
});
