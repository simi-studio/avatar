"use client";

import { useTranslations } from "next-intl";

import { AVATAR_STYLES, getStylePreviewSrc } from "@/styles/avatar-styles";
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
      <div
        role="group"
        aria-label={t("label")}
        className="grid grid-cols-5 gap-1.5"
      >
        {AVATAR_STYLES.map((style) => {
          const selected = style.id === value;
          const previewSrc = getStylePreviewSrc(style.id);
          const label = t(style.id);
          return (
            <button
              key={style.id}
              type="button"
              aria-pressed={selected}
              aria-label={label}
              onClick={() => onChange(style.id)}
              className={cn(
                "flex flex-col items-stretch gap-1 rounded-md p-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "relative block aspect-square overflow-hidden rounded-md border bg-muted",
                  selected ? "border-primary ring-1 ring-primary" : "border-border",
                )}
              >
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>
              <span className="truncate px-0.5 text-center text-[11px] font-medium leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
