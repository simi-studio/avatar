"use client";

import { useTranslations } from "next-intl";

import { AVATAR_THEMES, getThemeById } from "@/styles/avatar-themes";
import { cn } from "@/lib/utils";

export function ThemePicker({
  themeId,
  variantId,
  onThemeChange,
  onVariantChange,
}: {
  themeId: string | undefined;
  variantId: string | undefined;
  onThemeChange: (themeId: string) => void;
  onVariantChange: (variantId: string) => void;
}) {
  const t = useTranslations("Theme");
  const theme = getThemeById(themeId) ?? AVATAR_THEMES[0];

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("label")}</legend>
        <div role="group" aria-label={t("label")} className="flex flex-wrap gap-2">
          {AVATAR_THEMES.map((option) => {
            const selected = option.id === theme?.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onThemeChange(option.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}
              >
                {t(option.id)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("variantLabel")}</legend>
        <div
          role="group"
          aria-label={t("variantLabel")}
          className="flex flex-wrap gap-2"
        >
          {theme?.variants.map((variant) => {
            const selected = variant.id === variantId;
            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onVariantChange(variant.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}
              >
                {t(variant.id)}
              </button>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
