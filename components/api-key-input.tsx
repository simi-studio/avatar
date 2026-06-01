"use client";

import { useTranslations } from "next-intl";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ApiKeyInput({
  value,
  onChange,
  onClear,
  saveForSession,
  onToggleSave,
  show,
  onToggleShow,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  saveForSession: boolean;
  onToggleSave: (save: boolean) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  const t = useTranslations("ApiKey");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="api-key">{t("label")}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="api-key"
            type={show ? "text" : "password"}
            autoComplete="off"
            value={value}
            placeholder={t("placeholder")}
            onChange={(event) => onChange(event.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={onToggleShow}
            aria-label={show ? t("hide") : t("show")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {show ? (
              <EyeOff className="h-4 w-4" aria-hidden />
            ) : (
              <Eye className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onClear}
          aria-label={t("clear")}
          disabled={!value}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          checked={saveForSession}
          onChange={(event) => onToggleSave(event.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        {t("save")}
      </label>
    </div>
  );
}
