import {
  createAvatarIntent,
  normalizeAvatarIntent,
  type AvatarIntent,
} from "@/lib/avatar-intent";

/**
 * Client-only generation history. Stores recent avatar *intents* (never images,
 * keys, or uploaded photos) in `localStorage` so a user can recall a previous
 * setup. Nothing here is ever sent to a server — this respects the project's
 * no-database / no-server-history red lines.
 */
export type HistoryEntry = {
  id: string;
  createdAt: number;
  intent: AvatarIntent;
};

export const HISTORY_STORAGE_KEY = "simi-avatar-history";
export const HISTORY_MAX_ENTRIES = 10;

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function newId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the non-crypto id
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function readHistory(): HistoryEntry[] {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const fallback = createAvatarIntent({ mode: "text" });
    return parsed
      .filter(
        (entry): entry is Record<string, unknown> =>
          typeof entry === "object" && entry !== null,
      )
      .map((entry) => ({
        id: typeof entry.id === "string" ? entry.id : newId(),
        createdAt:
          typeof entry.createdAt === "number" ? entry.createdAt : Date.now(),
        intent: normalizeAvatarIntent(entry.intent, fallback),
      }))
      .slice(0, HISTORY_MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function addHistoryEntry(intent: AvatarIntent): HistoryEntry[] {
  const entry: HistoryEntry = {
    id: newId(),
    createdAt: Date.now(),
    intent,
  };
  const next = [entry, ...readHistory()].slice(0, HISTORY_MAX_ENTRIES);
  const storage = safeStorage();
  if (storage) {
    try {
      storage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota or serialization errors; history is best-effort.
    }
  }
  return next;
}

export function clearHistory(): void {
  const storage = safeStorage();
  if (!storage) return;
  try {
    storage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Ignore storage access errors.
  }
}
