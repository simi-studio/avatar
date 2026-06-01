"use client";

import { useTranslations } from "next-intl";
import { ImagePlus, Type } from "lucide-react";

import { INPUT_SOURCES, type InputSource } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS: Record<InputSource, typeof Type> = {
  text: Type,
  photo: ImagePlus,
};

/**
 * Primary input-source toggle. Text avatars (default) need no upload; photo
 * avatars restyle an uploaded portrait. Lowering the barrier to the no-upload
 * path is intentional (see prd.md).
 */
export function SourceSelector({
  value,
  onChange,
}: {
  value: InputSource;
  onChange: (source: InputSource) => void;
}) {
  const t = useTranslations("Source");

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{t("label")}</span>
      <div
        role="tablist"
        aria-label={t("label")}
        className="grid grid-cols-2 gap-2"
      >
        {INPUT_SOURCES.map((source) => {
          const selected = source === value;
          const Icon = ICONS[source];
          return (
            <button
              key={source}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(source)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-accent text-accent-foreground"
                  : "hover:border-primary/60",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Icon className="h-4 w-4" aria-hidden />
                {t(source)}
              </span>
              <span className="text-xs text-muted-foreground">
                {t(`${source}Description`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
