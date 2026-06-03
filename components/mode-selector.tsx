"use client";

import { useTranslations } from "next-intl";

import { type GenerationMode } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Sub-mode selector shown beneath the input-source toggle. The available modes
 * depend on the current source (text → text/themed, photo → single/couple).
 */
export function ModeSelector({
  modes,
  value,
  onChange,
}: {
  modes: readonly GenerationMode[];
  value: GenerationMode;
  onChange: (mode: GenerationMode) => void;
}) {
  const t = useTranslations("Mode");

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t("label")}</legend>
      <div
        role="group"
        aria-label={t("label")}
        className="inline-flex rounded-lg border bg-muted p-1"
      >
        {modes.map((mode) => {
          const selected = mode === value;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
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
    </fieldset>
  );
}
