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
import {
  falProvider,
  isAllowedFalImageHost,
  mapFalError,
  mapFalSize,
  mapFalStrength,
} from "@/lib/providers/fal";
import type { ProviderGenerateInput } from "@/lib/types";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function pngFile(name = "a.png"): File {
  const file = new File([new Uint8Array([1, 2, 3, 4])], name, {
    type: "image/png",
  });
  if (typeof file.arrayBuffer !== "function") {
    Object.defineProperty(file, "arrayBuffer", {
      value: async () => new Uint8Array([1, 2, 3, 4]).buffer,
    });
  }
  return file;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("openai adapter", () => {
  it("accepts only OpenAI-supported app sizes", () => {
    expect(mapOpenAISize("1024x1024")).toBe("1024x1024");
    expect(() => mapOpenAISize("512x512")).toThrow(ProviderError);
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

  it("handles non-object OpenAI error bodies defensively", () => {
    expect(mapOpenAIError(429, null)).toBe("RATE_LIMITED");
    expect(mapOpenAIError(400, { error: { type: 123 } })).toBe(
      "INVALID_IMAGE",
    );
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

  it("uses current GPT Image defaults for OpenAI avatar generations", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ b64_json: "ZZZZ" }] }));
    vi.stubGlobal("fetch", fetchMock);

    await openaiProvider.generateAvatar({
      apiKey: "sk-test",
      mode: "text",
      prompt: "a polished avatar",
      size: "1024x1024",
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      model: "gpt-image-2",
      quality: "medium",
      background: "opaque",
      size: "1024x1024",
      n: 1,
    });
  });

  it("uses current GPT Image defaults for OpenAI avatar edits", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ b64_json: "AAAA" }] }));
    vi.stubGlobal("fetch", fetchMock);

    await openaiProvider.generateAvatar({
      apiKey: "sk-test",
      mode: "single",
      images: [pngFile()],
      prompt: "make an avatar",
      size: "1024x1024",
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const form = request.body as FormData;
    expect(form.get("model")).toBe("gpt-image-2");
    expect(form.get("quality")).toBe("medium");
    expect(form.get("background")).toBe("opaque");
    expect(form.get("size")).toBe("1024x1024");
    expect(form.has("input_fidelity")).toBe(false);
  });

  it("generates a labeled A/B pair for couple-text mode", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse({ data: [{ b64_json: "PAIR" }] })),
      );
    vi.stubGlobal("fetch", fetchMock);

    const images = await openaiProvider.generateAvatar({
      apiKey: "sk-test",
      mode: "couple-text",
      prompt: "a matching couple avatar set",
      size: "1024x1024",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.openai.com/v1/images/generations",
    );
    expect(images).toEqual([
      { base64: "PAIR", mimeType: "image/png", label: "A" },
      { base64: "PAIR", mimeType: "image/png", label: "B" },
    ]);
  });

  it("makes a single unlabeled call for couple-text same-frame", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ b64_json: "ONE" }] }));
    vi.stubGlobal("fetch", fetchMock);

    const images = await openaiProvider.generateAvatar({
      apiKey: "sk-test",
      mode: "couple-text",
      sameFrame: true,
      prompt: "both partners in one frame",
      size: "1024x1024",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(images).toEqual([{ base64: "ONE", mimeType: "image/png" }]);
  });

  it("adds distinct partner guidance to OpenAI couple-text prompts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: [{ b64_json: "PAIR" }] }));
    vi.stubGlobal("fetch", fetchMock);

    await openaiProvider.generateAvatar({
      apiKey: "sk-test",
      mode: "couple-text",
      prompt: "matching retro couple avatars",
      size: "1024x1024",
    });

    const firstRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const secondRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(firstRequest.body)).prompt).toContain(
      "Partner A",
    );
    expect(JSON.parse(String(firstRequest.body)).prompt).toContain(
      "male-presenting",
    );
    expect(JSON.parse(String(secondRequest.body)).prompt).toContain(
      "Partner B",
    );
    expect(JSON.parse(String(secondRequest.body)).prompt).toContain(
      "female-presenting",
    );
  });

  it("returns successful couple-text images when one OpenAI call fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ b64_json: "PAIR-A" }] }))
      .mockResolvedValueOnce(jsonResponse({ error: { code: "bad" } }, 500));
    vi.stubGlobal("fetch", fetchMock);

    const images = await openaiProvider.generateAvatar({
      apiKey: "sk-test",
      mode: "couple-text",
      prompt: "a matching couple avatar set",
      size: "1024x1024",
    });

    expect(images).toEqual([
      { base64: "PAIR-A", mimeType: "image/png", label: "A" },
    ]);
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

  it("adds distinct partner guidance to MiniMax couple-text prompts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: { image_base64: ["PAIR"] },
        base_resp: { status_code: 0 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await minimaxProvider.generateAvatar({
      apiKey: "mm-test",
      region: "global",
      mode: "couple-text",
      prompt: "matching retro couple avatars",
      size: "1024x1024",
    });

    const firstRequest = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const secondRequest = fetchMock.mock.calls[1]?.[1] as RequestInit;
    expect(JSON.parse(String(firstRequest.body)).prompt).toContain(
      "Partner A",
    );
    expect(JSON.parse(String(firstRequest.body)).prompt).toContain(
      "male-presenting",
    );
    expect(JSON.parse(String(secondRequest.body)).prompt).toContain(
      "Partner B",
    );
    expect(JSON.parse(String(secondRequest.body)).prompt).toContain(
      "female-presenting",
    );
  });

  it("uses square aspect ratio even if called with an invalid size", async () => {
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
      size: "bad-size" as never,
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      aspect_ratio: "1:1",
    });
  });

  it("uses square aspect ratio and MiniMax prompt optimization for avatars", async () => {
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
      size: "512x512",
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      aspect_ratio: "1:1",
      prompt_optimizer: true,
      response_format: "base64",
    });
    expect(JSON.parse(String(request.body))).not.toHaveProperty("width");
    expect(JSON.parse(String(request.body))).not.toHaveProperty("height");
  });

  it("uses image-01-live for illustrated MiniMax photo avatar styles", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: { image_base64: ["LIVE"] },
        base_resp: { status_code: 0 },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await minimaxProvider.generateAvatar({
      apiKey: "mm-test",
      region: "global",
      mode: "single",
      images: [pngFile()],
      prompt: "anime avatar",
      styleId: "anime",
      size: "1024x1024",
    });

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(request.body))).toMatchObject({
      model: "image-01-live",
    });
    expect(
      JSON.parse(String(request.body)).subject_reference[0].image_file,
    ).toMatch(/^data:image\/png;base64,/);
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

function imageResponse(bytes = [9, 9, 9, 9], contentType = "image/png"): Response {
  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: { "Content-Type": contentType },
  });
}

/** Branch the fetch mock: fal.run POST returns JSON, fal.media GET returns bytes. */
function falFetchMock(falJson: unknown) {
  return vi.fn((url: string) =>
    Promise.resolve(
      url.startsWith("https://fal.run/")
        ? jsonResponse(falJson)
        : imageResponse(),
    ),
  );
}

describe("fal adapter", () => {
  it("maps app sizes to FLUX image_size enums", () => {
    expect(mapFalSize("1024x1024")).toBe("square_hd");
    expect(mapFalSize("512x512")).toBe("square");
  });

  it("inverts reference strength into FLUX transformation strength", () => {
    // Higher likeness (0.85) keeps more of the source -> lower transform strength.
    expect(mapFalStrength(0.85)).toBeLessThan(mapFalStrength(0.35));
    expect(mapFalStrength(undefined)).toBeGreaterThan(0.4);
  });

  it("only downloads images from fal-controlled hosts", () => {
    expect(isAllowedFalImageHost("https://fal.media/files/a.png")).toBe(true);
    expect(isAllowedFalImageHost("https://v3.fal.media/files/a.png")).toBe(true);
    expect(isAllowedFalImageHost("http://fal.media/files/a.png")).toBe(false);
    expect(isAllowedFalImageHost("https://evil.example.com/a.png")).toBe(false);
  });

  it("maps fal statuses to normalized codes", () => {
    expect(mapFalError(401, {})).toBe("INVALID_API_KEY");
    expect(mapFalError(402, {})).toBe("INSUFFICIENT_CREDITS");
    expect(mapFalError(429, {})).toBe("RATE_LIMITED");
    expect(mapFalError(422, {})).toBe("INVALID_MODE_INPUT");
    expect(mapFalError(200, { detail: "NSFW content detected" })).toBe(
      "CONTENT_REJECTED",
    );
  });

  it("calls the text-to-image model and returns a base64 image", async () => {
    const fetchMock = falFetchMock({
      images: [
        { url: "https://fal.media/files/out.png", content_type: "image/png" },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    const images = await falProvider.generateAvatar({
      apiKey: "key-test",
      mode: "text",
      prompt: "a friendly avatar",
      size: "1024x1024",
    });

    const [textUrl, textInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(textUrl).toBe("https://fal.run/fal-ai/flux/dev");
    expect((textInit.headers as Record<string, string>).Authorization).toBe(
      "Key key-test",
    );
    expect(JSON.parse(String(textInit.body))).toMatchObject({
      image_size: "square_hd",
      num_images: 1,
    });
    expect(images).toHaveLength(1);
    expect(images[0]?.mimeType).toBe("image/png");
    expect(images[0]?.base64?.length ?? 0).toBeGreaterThan(0);
  });

  it("calls the image-to-image model for single mode", async () => {
    const fetchMock = falFetchMock({
      images: [{ url: "https://fal.media/files/out.png" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await falProvider.generateAvatar({
      apiKey: "key-test",
      mode: "single",
      images: [pngFile()],
      prompt: "stylize me",
      referenceStrength: 0.85,
      size: "1024x1024",
    });

    const [i2iUrl, i2iInit] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(i2iUrl).toBe("https://fal.run/fal-ai/flux/dev/image-to-image");
    const body = JSON.parse(String(i2iInit.body));
    expect(body.image_url).toMatch(/^data:image\/png;base64,/);
    expect(typeof body.strength).toBe("number");
  });

  it("rejects images returned from non-fal hosts", async () => {
    const fetchMock = falFetchMock({
      images: [{ url: "https://evil.example.com/out.png" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      falProvider.generateAvatar({
        apiKey: "key-test",
        mode: "text",
        prompt: "x",
        size: "1024x1024",
      }),
    ).rejects.toMatchObject({ code: "UNKNOWN_ERROR" });
  });

  it("maps an error status from the fal.run call", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(jsonResponse({ detail: "Unauthorized" }, 401)),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      falProvider.generateAvatar({
        apiKey: "bad-key",
        mode: "text",
        prompt: "x",
        size: "1024x1024",
      }),
    ).rejects.toMatchObject({ code: "INVALID_API_KEY" });
  });

  it("generates a labeled A/B pair for couple-text mode", async () => {
    const fetchMock = falFetchMock({
      images: [{ url: "https://fal.media/files/out.png" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const images = await falProvider.generateAvatar({
      apiKey: "key-test",
      mode: "couple-text",
      prompt: "a couple",
      size: "1024x1024",
    });

    expect(images.map((image) => image.label).sort()).toEqual(["A", "B"]);
  });

  it("returns a single unlabeled image for couple-text same-frame", async () => {
    const fetchMock = falFetchMock({
      images: [{ url: "https://fal.media/files/out.png" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const images = await falProvider.generateAvatar({
      apiKey: "key-test",
      mode: "couple-text",
      sameFrame: true,
      prompt: "a couple in one frame",
      size: "1024x1024",
    });

    expect(images).toHaveLength(1);
    expect(images[0]?.label).toBeUndefined();
    // One generation call (fal.run) + one image download.
    const falCalls = fetchMock.mock.calls.filter((call) =>
      String(call[0]).startsWith("https://fal.run/"),
    );
    expect(falCalls).toHaveLength(1);
  });
});
