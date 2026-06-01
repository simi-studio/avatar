"use client";

import { useTranslations } from "next-intl";

import { GENERATION_MODES, type GenerationMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ModeSelector({
  value,
  onChange,
}: {
  value: GenerationMode;
  onChange: (mode: GenerationMode) => void;
}) {
  const t = useTranslations("Mode");

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t("label")}</span>
      <div
        role="tablist"
        aria-label={t("label")}
        className="inline-flex rounded-lg border bg-muted p-1"
      >
        {GENERATION_MODES.map((mode) => {
          const selected = mode === value;
          return (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(mode)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(mode)}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {t(`${value}Description`)}
      </p>
    </div>
  );
}
