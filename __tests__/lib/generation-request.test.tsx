// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { createAvatarIntent } from "@/lib/avatar-intent";
import { useGenerationRequest } from "@/lib/use-generation-request";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const intent = createAvatarIntent({ mode: "text", styleId: "anime" });

describe("useGenerationRequest", () => {
  it("maps abort/timeout to PROVIDER_TIMEOUT and preserves prior images", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGenerationRequest());

    act(() => {
      result.current.restore(
        [{ base64: "parent", mimeType: "image/png" }],
        intent,
      );
    });
    expect(result.current.images[0]?.base64).toBe("parent");

    await act(async () => {
      await result.current.run({
        intent,
        apiKey: "sk-test",
        preserveExistingImages: true,
        buildForm: () => new FormData(),
      });
    });

    await waitFor(() => {
      expect(result.current.errorCode).toBe("PROVIDER_TIMEOUT");
    });
    expect(result.current.status).toBe("success");
    expect(result.current.images[0]?.base64).toBe("parent");
  });

  it("aborts and ignores an older request when a replacement finishes first", async () => {
    let resolveFirst: ((value: { json: () => Promise<unknown> }) => void) | undefined;
    const firstResponse = new Promise<{ json: () => Promise<unknown> }>(
      (resolve) => {
        resolveFirst = resolve;
      },
    );
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          images: [{ base64: "newer", mimeType: "image/png" }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useGenerationRequest());
    let firstRun: Promise<void> | undefined;
    act(() => {
      firstRun = result.current.run({
        intent,
        apiKey: "sk-test",
        buildForm: () => new FormData(),
      });
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.run({
        intent,
        apiKey: "sk-test",
        buildForm: () => new FormData(),
      });
    });
    expect(
      (fetchMock.mock.calls[0]?.[1] as RequestInit).signal,
    ).toHaveProperty("aborted", true);
    expect(result.current.images[0]?.base64).toBe("newer");

    resolveFirst?.({
      json: async () => ({
        success: true,
        images: [{ base64: "older", mimeType: "image/png" }],
      }),
    });
    await act(async () => {
      await firstRun;
    });
    expect(result.current.images[0]?.base64).toBe("newer");
  });
});
