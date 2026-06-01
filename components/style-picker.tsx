"use client";

import { useTranslations } from "next-intl";

import { AVATAR_STYLES } from "@/styles/avatar-styles";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function StylePicker({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (styleId: string) => void;
}) {
  const t = useTranslations("Style");

  return (
    <div className="flex flex-col gap-2">
      <Label>{t("label")}</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {AVATAR_STYLES.map((style) => {
          const selected = style.id === value;
          return (
            <button
              key={style.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(style.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-accent text-accent-foreground"
                  : "hover:border-primary/60",
              )}
            >
              {t(style.id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
