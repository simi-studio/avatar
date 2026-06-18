"use client";

import { useFormatter, useTranslations } from "next-intl";
import { History, RotateCcw, Trash2 } from "lucide-react";

import type { AvatarIntent } from "@/lib/avatar-intent";
import type { HistoryEntry } from "@/lib/local-history";
import { Button } from "@/components/ui/button";

function truncate(value: string, max = 64): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/**
 * Recall panel for client-only generation history. Each entry restores a past
 * avatar intent into the form. History lives only in this browser and is never
 * uploaded (see `lib/local-history.ts`).
 */
export function GenerationHistory({
  entries,
  onRestore,
  onClear,
}: {
  entries: HistoryEntry[];
  onRestore: (intent: AvatarIntent) => void;
  onClear: () => void;
}) {
  const t = useTranslations("History");
  const tMode = useTranslations("Mode");
  const tStyle = useTranslations("Style");
  const tTheme = useTranslations("Theme");
  const format = useFormatter();

  if (entries.length === 0) return null;

  function entryLabel(intent: AvatarIntent): string {
    const variant =
      intent.mode === "themed" && intent.themeId
        ? tTheme(intent.themeId)
        : intent.styleId
          ? tStyle(intent.styleId)
          : undefined;
    const head = variant ? `${tMode(intent.mode)} · ${variant}` : tMode(intent.mode);
    const description = intent.subjectDescription?.trim();
    return description ? `${head} — ${truncate(description)}` : head;
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4"
      aria-label={t("label")}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <History className="h-4 w-4" aria-hidden />
          {t("label")}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {t("clear")}
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => onRestore(entry.intent)}
              className="flex w-full items-center justify-between gap-3 rounded-md border bg-background p-2 text-left text-sm transition-colors hover:bg-muted"
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{entryLabel(entry.intent)}</span>
                <span className="text-xs text-muted-foreground">
                  {format.relativeTime(entry.createdAt, Date.now())}
                </span>
              </span>
              <RotateCcw
                className="h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="sr-only">{t("restore")}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{t("localOnly")}</p>
    </section>
  );
}
