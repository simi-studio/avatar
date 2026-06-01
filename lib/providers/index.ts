import type { ImageProvider, ProviderId } from "@/lib/types";
import { openaiProvider } from "./openai";
import { minimaxProvider } from "./minimax";

export const providers: Record<ProviderId, ImageProvider> = {
  openai: openaiProvider,
  minimax: minimaxProvider,
};

export function getProvider(id: ProviderId): ImageProvider {
  return providers[id];
}

export { openaiProvider, minimaxProvider };
