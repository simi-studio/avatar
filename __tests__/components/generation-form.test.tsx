import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";

import en from "@/i18n/en.json";

// next/navigation is not available in jsdom; provide a stable stub.
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

// Avoid canvas usage from the real EXIF-stripping pipeline in jsdom.
vi.mock("@/lib/image-utils", () => ({
  stripExifAndCompress: async (file: File) => file,
  readImageDimensions: async () => ({ width: 1024, height: 1024 }),
}));

import { GenerationForm } from "@/components/generation-form";

function renderForm() {
  return render(
    <NextIntlClientProvider locale="en" messages={en}>
      <GenerationForm />
    </NextIntlClientProvider>,
  );
}

function setFetch(response: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  window.sessionStorage.clear();
  // jsdom lacks createObjectURL.
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, "createObjectURL", { value: () => "blob:mock" });
  }
  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, "revokeObjectURL", { value: () => undefined });
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("GenerationForm", () => {
  it("renders single mode inputs by default and switches to themed", () => {
    renderForm();

    // Single mode shows the upload area and style picker.
    expect(screen.getByText(en.Upload.label)).toBeInTheDocument();
    expect(screen.getByText(en.Style.anime)).toBeInTheDocument();

    // Switch to themed: theme picker appears, single upload label goes away.
    fireEvent.click(screen.getByRole("tab", { name: en.Mode.themed }));
    expect(screen.getByText(en.Theme.label)).toBeInTheDocument();
    expect(screen.queryByText(en.Upload.label)).not.toBeInTheDocument();
  });

  it("disables generate until a single-mode setup is complete", () => {
    renderForm();
    const generate = screen.getByRole("button", { name: en.Generate.generate });
    expect(generate).toBeDisabled();
  });

  it("runs the single-mode happy path and shows the result", async () => {
    const fetchMock = setFetch({
      success: true,
      images: [{ base64: "AAAA", mimeType: "image/png" }],
    });
    const { container } = renderForm();

    fireEvent.change(screen.getByLabelText(en.ApiKey.label), {
      target: { value: "sk-test-key" },
    });

    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "me.png", {
      type: "image/png",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText(en.Upload.remove)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: en.Style.anime }));

    const generate = screen.getByRole("button", { name: en.Generate.generate });
    await waitFor(() => expect(generate).toBeEnabled());
    fireEvent.click(generate);

    await waitFor(() =>
      expect(screen.getByAltText(en.Result.altSingle)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/generate", expect.anything());
  });

  it("surfaces a normalized error code on failure", async () => {
    setFetch({ success: false, error: { code: "INVALID_API_KEY", message: "x" } });
    const { container } = renderForm();

    fireEvent.change(screen.getByLabelText(en.ApiKey.label), {
      target: { value: "bad-key" },
    });
    const fileInput = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: {
        files: [new File([new Uint8Array([1])], "me.png", { type: "image/png" })],
      },
    });
    await waitFor(() =>
      expect(screen.getByText(en.Upload.remove)).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: en.Style.anime }));
    fireEvent.click(screen.getByRole("button", { name: en.Generate.generate }));

    await waitFor(() =>
      expect(
        screen.getByText(en.Errors.INVALID_API_KEY),
      ).toBeInTheDocument(),
    );
  });
});
