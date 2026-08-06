// @vitest-environment node
// The generate route is server-only; exercise it under Node's fetch primitives
// (streaming request bodies, Blob/Request reconstruction) rather than jsdom's.
import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/generate/route";
import { MAX_GENERATE_REQUEST_BYTES } from "@/lib/constants";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function request(body: BodyInit, headers: Record<string, string>): Request {
  return new Request("https://avatar.test/api/generate", {
    method: "POST",
    headers,
    body,
  });
}

describe("/api/generate", () => {
  it("rejects oversized requests before reading the body", async () => {
    const body = {
      getReader: vi.fn(() => {
        throw new Error("body was read");
      }),
    } as unknown as ReadableStream<Uint8Array>;

    const res = await POST(
      request(body, {
        "content-type": "application/json",
        "content-length": String(25 * 1024 * 1024 + 1),
      }),
    );

    expect(res.status).toBe(413);
    expect(body.getReader).not.toHaveBeenCalled();
  });

  it("rejects oversized requests when content-length is unavailable", async () => {
    const res = await POST(
      request("x".repeat(MAX_GENERATE_REQUEST_BYTES + 1), {
        "content-type": "application/json",
      }),
    );

    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: "IMAGE_TOO_LARGE" },
    });
  });

  it("returns 415 for unsupported media types", async () => {
    const res = await POST(
      request("plain text", {
        "content-type": "text/plain",
        "content-length": "10",
      }),
    );

    expect(res.status).toBe(415);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: "UNSUPPORTED_MEDIA_TYPE" },
    });
  });

  it("rejects cross-origin browser requests", async () => {
    const res = await POST(
      request("{}", {
        "content-type": "application/json",
        "content-length": "2",
        origin: "https://evil.test",
        host: "avatar.test",
      }),
    );

    expect(res.status).toBe(403);
    const body = (await res.json()) as {
      error?: { code?: string };
    };
    expect(body.error?.code).toBe("FORBIDDEN");
  });

  it("rejects unknown style ids before calling a provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      request(
        JSON.stringify({
          provider: "openai",
          apiKey: "sk-test",
          mode: "text",
          styleId: "not-a-style",
          size: "1024x1024",
        }),
        {
          "content-type": "application/json",
          "content-length": "120",
          origin: "https://avatar.test",
          host: "avatar.test",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unknown theme variants before calling a provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      request(
        JSON.stringify({
          provider: "openai",
          apiKey: "sk-test",
          mode: "themed",
          themeId: "dogs",
          variantId: "not-a-variant",
          size: "1024x1024",
        }),
        {
          "content-type": "application/json",
          "content-length": "140",
          origin: "https://avatar.test",
          host: "avatar.test",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects with 403 when Turnstile is enabled and the token is missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      request(
        JSON.stringify({
          provider: "openai",
          apiKey: "sk-test",
          mode: "text",
          styleId: "anime",
          size: "1024x1024",
        }),
        {
          "content-type": "application/json",
          "content-length": "120",
          origin: "https://avatar.test",
          host: "avatar.test",
        },
      ),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: "CHALLENGE_FAILED" },
    });
    // No siteverify and no provider call happen for a missing token.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("verifies the token, then proceeds past the challenge when it passes", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("siteverify")) {
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }
      throw new Error("provider should not be reached for an invalid style");
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(
      request(
        JSON.stringify({
          provider: "openai",
          apiKey: "sk-test",
          mode: "text",
          styleId: "not-a-style",
          size: "1024x1024",
          turnstileToken: "tok",
        }),
        {
          "content-type": "application/json",
          "content-length": "150",
          origin: "https://avatar.test",
          host: "avatar.test",
        },
      ),
    );

    // Passed the challenge (not 403), then failed later on the invalid style.
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: "INVALID_MODE_INPUT" },
    });
    // Exactly one fetch: the siteverify call; the provider was never reached.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("siteverify");
  });

  it("edits one selected result with explicit change and preserve constraints", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: [{ b64_json: "edited" }] }), {
          status: 200,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.append("provider", "openai");
    form.append("apiKey", "sk-test");
    form.append("mode", "text");
    form.append("operation", "edit");
    form.append("styleId", "anime");
    form.append("size", "1024x1024");
    form.append(
      "intent",
      JSON.stringify(
        createAvatarIntentForRouteTest({
          mode: "text",
          styleId: "anime",
        }),
      ),
    );
    form.append(
      "editIntent",
      JSON.stringify({
        change: ["add warmer light"],
        preserve: ["identity", "framing"],
      }),
    );
    form.append(
      "images",
      new File(
        [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])],
        "selected.png",
        { type: "image/png" },
      ),
    );

    const res = await POST(
      new Request("https://avatar.test/api/generate", {
        method: "POST",
        headers: {
          origin: "https://avatar.test",
          host: "avatar.test",
        },
        body: form,
      }),
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.openai.com/v1/images/edits",
    );
    const upstream = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const upstreamForm = upstream.body as FormData;
    const prompt = String(upstreamForm.get("prompt"));
    expect(prompt).toContain("add warmer light");
    expect(prompt).toContain("identity");
    // Dedicated edit compiler: no full generate redesign stack.
    expect(prompt).not.toContain("Create professional profile avatar");
    expect(prompt).toMatch(/Requested changes|change:/i);
    expect(upstreamForm.get("image")).toBeInstanceOf(File);
  });

  it("rejects multi-image single requests when multi-reference is not capability-true", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.append("provider", "openai");
    form.append("apiKey", "sk-test");
    form.append("mode", "single");
    form.append("styleId", "anime");
    form.append("size", "1024x1024");
    form.append(
      "intent",
      JSON.stringify({
        mode: "single",
        goal: "professional-profile",
        styleId: "anime",
        likeness: "high",
        creativity: "low",
        composition: "headshot",
        background: "studio",
        size: "1024x1024",
      }),
    );
    form.append(
      "images",
      new File(
        [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])],
        "a.png",
        { type: "image/png" },
      ),
    );
    form.append(
      "images",
      new File(
        [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])],
        "b.png",
        { type: "image/png" },
      ),
    );

    const res = await POST(
      new Request("https://avatar.test/api/generate", {
        method: "POST",
        headers: {
          origin: "https://avatar.test",
          host: "avatar.test",
        },
        body: form,
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      success: false,
      error: { code: "INVALID_MODE_INPUT" },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects incomplete edit operations without calling the provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const form = new FormData();
    form.append("provider", "openai");
    form.append("apiKey", "sk-should-never-leak");
    form.append("mode", "text");
    form.append("operation", "edit");
    form.append("styleId", "anime");
    form.append("size", "1024x1024");
    form.append(
      "intent",
      JSON.stringify(
        createAvatarIntentForRouteTest({
          mode: "text",
          styleId: "anime",
        }),
      ),
    );
    // Missing editIntent and image.

    const res = await POST(
      new Request("https://avatar.test/api/generate", {
        method: "POST",
        headers: {
          origin: "https://avatar.test",
          host: "avatar.test",
        },
        body: form,
      }),
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      success: boolean;
      error?: { code?: string; message?: string };
    };
    expect(body).toMatchObject({
      success: false,
      error: { code: "INVALID_MODE_INPUT" },
    });
    // Error payloads must never echo keys, edit plans, or image bytes.
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("sk-should-never-leak");
    expect(serialized).not.toContain("base64");
    expect(serialized).not.toContain("editIntent");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function createAvatarIntentForRouteTest(input: {
  mode: "text";
  styleId: string;
}) {
  return {
    ...input,
    goal: "professional-profile",
    likeness: "medium",
    creativity: "medium",
    composition: "headshot",
    background: "studio",
    size: "1024x1024",
  };
}
