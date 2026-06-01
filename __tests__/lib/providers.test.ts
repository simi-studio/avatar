import { afterEach, describe, expect, it, vi } from "vitest";

import { ProviderError } from "@/lib/types";
import {
  mapOpenAIError,
  mapOpenAISize,
  openaiProvider,
} from "@/lib/providers/openai";
import {
  mapMiniMaxStatus,
  minimaxProvider,
  resolveMiniMaxBaseUrl,
} from "@/lib/providers/minimax";
import type { ProviderGenerateInput } from "@/lib/types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pngFile(name = "a.png"): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: "image/png" });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("openai adapter", () => {
  it("maps both MVP sizes to a supported size", () => {
    expect(mapOpenAISize("512x512")).toBe("1024x1024");
    expect(mapOpenAISize("1024x1024")).toBe("1024x1024");
  });

  it("maps errors to normalized codes", () => {
    expect(mapOpenAIError(401, {})).toBe("INVALID_API_KEY");
    expect(mapOpenAIError(429, { error: { code: "insufficient_quota" } })).toBe(
      "INSUFFICIENT_CREDITS",
    );
    expect(mapOpenAIError(429, {})).toBe("RATE_LIMITED");
    expect(mapOpenAIError(400, { error: { code: "moderation_blocked" } })).toBe(
      "CONTENT_REJECTED",
    );
    expect(mapOpenAIError(504, {})).toBe("PROVIDER_TIMEOUT");
  });

  it("calls the edits endpoint for single mode", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ b64_json: "AAAA" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const input: ProviderGenerateInput = {
      apiKey: "sk-test",
      mode: "single",
      images: [pngFile()],
      prompt: "make an avatar",
      size: "1024x1024",
    };
    const images = await openaiProvider.generateAvatar(input);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.openai.com/v1/images/edits",
    );
    expect(images).toEqual([{ base64: "AAAA", mimeType: "image/png" }]);
  });

  it("calls the generations endpoint for themed mode", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ b64_json: "ZZZZ" }] }));
    vi.stubGlobal("fetch", fetchMock);

    await openaiProvider.generateAvatar({
      apiKey: "sk-test",
      mode: "themed",
      prompt: "a dog avatar",
      size: "1024x1024",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.openai.com/v1/images/generations",
    );
  });

  it("throws a normalized error on auth failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: { code: "invalid_api_key" } }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      openaiProvider.generateAvatar({
        apiKey: "bad",
        mode: "themed",
        prompt: "x",
        size: "1024x1024",
      }),
    ).rejects.toMatchObject({ code: "INVALID_API_KEY" });
  });

  it("never embeds the API key in the request URL", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ b64_json: "AAAA" }] }));
    vi.stubGlobal("fetch", fetchMock);

    await openaiProvider.generateAvatar({
      apiKey: "sk-super-secret",
      mode: "themed",
      prompt: "x",
      size: "1024x1024",
    });

    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain("sk-super-secret");
  });
});

describe("minimax adapter", () => {
  it("resolves region-specific base URLs", () => {
    expect(resolveMiniMaxBaseUrl("global")).toBe("https://api.minimax.io");
    expect(resolveMiniMaxBaseUrl("china")).toBe("https://api.minimaxi.com");
    expect(resolveMiniMaxBaseUrl(undefined)).toBe("https://api.minimax.io");
  });

  it("maps status codes to normalized errors", () => {
    expect(mapMiniMaxStatus(1004)).toBe("INVALID_REGION");
    expect(mapMiniMaxStatus(1008)).toBe("INSUFFICIENT_CREDITS");
    expect(mapMiniMaxStatus(1002)).toBe("RATE_LIMITED");
    expect(mapMiniMaxStatus(1027)).toBe("CONTENT_REJECTED");
    expect(mapMiniMaxStatus(9999)).toBe("UNKNOWN_ERROR");
  });

  it("uses the global base URL when region is global", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: { image_base64: ["BBBB"] },
        base_resp: { status_code: 0 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await minimaxProvider.generateAvatar({
      apiKey: "mm-test",
      region: "global",
      mode: "themed",
      prompt: "a dog avatar",
      size: "1024x1024",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.minimax.io/v1/image_generation",
    );
  });

  it("uses the China base URL when region is china", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: { image_base64: ["CCCC"] },
        base_resp: { status_code: 0 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await minimaxProvider.generateAvatar({
      apiKey: "mm-test",
      region: "china",
      mode: "themed",
      prompt: "a dog avatar",
      size: "1024x1024",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.minimaxi.com/v1/image_generation",
    );
  });

  it("surfaces a wrong-region key as INVALID_REGION", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      minimaxProvider.generateAvatar({
        apiKey: "global-key-on-china",
        region: "china",
        mode: "themed",
        prompt: "x",
        size: "1024x1024",
      }),
    ).rejects.toBeInstanceOf(ProviderError);
    await expect(
      minimaxProvider.generateAvatar({
        apiKey: "global-key-on-china",
        region: "china",
        mode: "themed",
        prompt: "x",
        size: "1024x1024",
      }),
    ).rejects.toMatchObject({ code: "INVALID_REGION" });
  });

  it("maps insufficient credits via base_resp", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ base_resp: { status_code: 1008 } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      minimaxProvider.generateAvatar({
        apiKey: "mm",
        region: "global",
        mode: "themed",
        prompt: "x",
        size: "1024x1024",
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_CREDITS" });
  });
});
