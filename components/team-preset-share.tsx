"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Share2 } from "lucide-react";

import { encodePreset, type TeamPreset } from "@/lib/preset";
import { Button } from "@/components/ui/button";

/**
 * Builds a shareable team preset link for the current base setup and copies it
 * to the clipboard. The link carries only non-sensitive configuration — never
 * the API key (enforced by `encodePreset`).
 */
export function TeamPresetShare({ preset }: { preset: TeamPreset }) {
  const t = useTranslations("Preset");
  const [copied, setCopied] = useState(false);

  async function copy() {
    const code = encodePreset(preset);
    const url = new URL(window.location.href);
    url.searchParams.set("preset", code);
    if (preset.mode) url.searchParams.set("mode", preset.mode);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      {copied ? t("copied") : t("copyLink")}
    </Button>
  );
}
