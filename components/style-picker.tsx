"use client";

import { useTranslations } from "next-intl";

import { AVATAR_STYLES } from "@/styles/avatar-styles";
import { cn } from "@/lib/utils";

export function StylePicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (styleId: string) => void;
}) {
  const t = useTranslations("Style");

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t("label")}</legend>
      <div role="group" aria-label={t("label")} className="flex flex-wrap gap-2">
        {AVATAR_STYLES.map((style) => {
          const selected = style.id === value;
          return (
            <button
              key={style.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(style.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:border-primary/60 hover:text-foreground",
              )}
            >
              {t(style.id)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
