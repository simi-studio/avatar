import type { ImageProvider, ProviderId } from "@/lib/types";
import { openaiProvider } from "./openai";
import { minimaxProvider } from "./minimax";
import { falProvider } from "./fal";

export const providers: Record<ProviderId, ImageProvider> = {
  openai: openaiProvider,
  minimax: minimaxProvider,
  fal: falProvider,
};

export function getProvider(id: ProviderId): ImageProvider {
  return providers[id];
}

export { openaiProvider, minimaxProvider, falProvider };
