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
                "flex flex-col gap-2 overflow-hidden rounded-lg border p-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-accent text-accent-foreground"
                  : "hover:border-primary/60",
              )}
            >
              {style.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={style.thumbnail}
                  alt=""
                  aria-hidden
                  className="aspect-square w-full rounded-md border object-cover"
                />
              )}
              <span className="text-center text-xs font-medium sm:text-sm">
                {t(style.id)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
