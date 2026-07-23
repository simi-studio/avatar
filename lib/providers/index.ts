import type { ImageProvider, ProviderId } from "@/lib/types";
import { openaiProvider } from "./openai";
import { minimaxProvider } from "./minimax";
import { falProvider } from "./fal";
import { xaiProvider } from "./xai";

export const providers: Record<ProviderId, ImageProvider> = {
  openai: openaiProvider,
  minimax: minimaxProvider,
  fal: falProvider,
  xai: xaiProvider,
};

export function getProvider(id: ProviderId): ImageProvider {
  return providers[id];
}

export { openaiProvider, minimaxProvider, falProvider, xaiProvider };
