import { describe, expect, it } from "vitest";

import {
  defaultSizeForProvider,
  sizesForProvider,
} from "@/lib/provider-capabilities";

describe("provider capabilities", () => {
  it("exposes only real OpenAI image sizes", () => {
    expect(sizesForProvider("openai")).toEqual(["1024x1024"]);
    expect(defaultSizeForProvider("openai")).toBe("1024x1024");
  });

  it("exposes both MiniMax MVP image sizes", () => {
    expect(sizesForProvider("minimax")).toEqual(["512x512", "1024x1024"]);
    expect(defaultSizeForProvider("minimax")).toBe("1024x1024");
  });
});
