"use client";

import { useTranslations } from "next-intl";

import type { GenerationCandidate } from "@/lib/generation-session";
import { imageSrc } from "@/components/result-preview";
import { cn } from "@/lib/utils";

/**
 * Compact in-session candidate branch selector (Epic 11.3).
 * Session-memory only — never links to history, URLs, or downloads of the graph.
 */
export function CandidateStrip({
  candidates,
  selectedId,
  onSelect,
  disabled = false,
}: {
  candidates: GenerationCandidate[];
  selectedId?: string;
  onSelect: (candidateId: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Candidates");
  if (candidates.length <= 1) return null;

  return (
    <section className="flex flex-col gap-2 border-t pt-3" aria-label={t("title")}>
      <span className="text-xs font-medium text-muted-foreground">
        {t("title")}
      </span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {candidates.map((candidate, index) => {
          const selected = candidate.id === selectedId;
          const src = imageSrc(candidate.image);
          const operationLabel = t(`operation.${candidate.operation}`);
          return (
            <button
              key={candidate.id}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={t("selectLabel", {
                index: index + 1,
                operation: operationLabel,
              })}
              onClick={() => onSelect(candidate.id)}
              className={cn(
                "flex w-20 shrink-0 flex-col gap-1 rounded-md border p-1 text-left transition-colors",
                selected
                  ? "border-primary bg-primary/10 ring-1 ring-primary"
                  : "border-border hover:border-primary/50",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt=""
                  className="aspect-square w-full rounded object-cover"
                />
              ) : (
                <div className="aspect-square w-full rounded bg-muted" />
              )}
              <span className="truncate text-[10px] font-medium leading-tight">
                {operationLabel}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {t("version", { index: index + 1 })}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">{t("hint")}</p>
    </section>
  );
}
