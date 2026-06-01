"use client";

import { useTranslations } from "next-intl";

import { AVATAR_THEMES, getThemeById } from "@/styles/avatar-themes";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
      <div className="flex flex-col gap-2">
        <Label>{t("label")}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AVATAR_THEMES.map((option) => {
            const selected = option.id === theme?.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onThemeChange(option.id)}
                className={cn(
                  "flex flex-col gap-2 overflow-hidden rounded-lg border p-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-accent text-accent-foreground"
                    : "hover:border-primary/60",
                )}
              >
                {option.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={option.thumbnail}
                    alt=""
                    aria-hidden
                    className="aspect-square w-full rounded-md border object-cover"
                  />
                )}
                <span className="text-center text-xs font-medium sm:text-sm">
                  {t(option.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("variantLabel")}</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {theme?.variants.map((variant) => {
            const selected = variant.id === variantId;
            return (
              <button
                key={variant.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onVariantChange(variant.id)}
                className={cn(
                  "flex flex-col gap-2 overflow-hidden rounded-lg border p-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected
                    ? "border-primary bg-accent text-accent-foreground"
                    : "hover:border-primary/60",
                )}
              >
                {variant.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={variant.thumbnail}
                    alt=""
                    aria-hidden
                    className="aspect-square w-full rounded-md border object-cover"
                  />
                )}
                <span className="text-center text-xs font-medium sm:text-sm">
                  {t(variant.id)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
