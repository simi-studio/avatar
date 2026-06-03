import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/generate/route";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
});
