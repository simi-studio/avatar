import { beforeEach, describe, expect, it } from "vitest";

import { createAvatarIntent } from "@/lib/avatar-intent";
import {
  HISTORY_MAX_ENTRIES,
  HISTORY_STORAGE_KEY,
  addHistoryEntry,
  clearHistory,
  readHistory,
} from "@/lib/local-history";

function intent(description: string) {
  return createAvatarIntent({
    mode: "text",
    goal: "social-avatar",
    styleId: "anime",
    subjectDescription: description,
  });
}

describe("local history", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty", () => {
    expect(readHistory()).toEqual([]);
  });

  it("adds entries newest-first and persists them", () => {
    addHistoryEntry(intent("first"));
    addHistoryEntry(intent("second"));
    const entries = readHistory();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.intent.subjectDescription).toBe("second");
    expect(entries[1]?.intent.subjectDescription).toBe("first");
    expect(entries[0]?.id).not.toBe(entries[1]?.id);
  });

  it("caps the history at HISTORY_MAX_ENTRIES", () => {
    for (let i = 0; i < HISTORY_MAX_ENTRIES + 5; i += 1) {
      addHistoryEntry(intent(`entry-${i}`));
    }
    expect(readHistory()).toHaveLength(HISTORY_MAX_ENTRIES);
  });

  it("clears the history", () => {
    addHistoryEntry(intent("to clear"));
    clearHistory();
    expect(readHistory()).toEqual([]);
  });

  it("recovers from malformed storage", () => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, "not json");
    expect(readHistory()).toEqual([]);
  });

  it("persists only intent data, never credentials", () => {
    addHistoryEntry(intent("clean"));
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "";
    expect(raw.toLowerCase()).not.toContain("apikey");
    expect(raw.toLowerCase()).not.toContain("token");
    expect(raw).not.toContain("sk-");
  });
});
