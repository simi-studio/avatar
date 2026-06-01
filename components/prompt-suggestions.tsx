"use client";

import { useTranslations } from "next-intl";

import type { GenerationMode, ProviderId } from "@/lib/constants";
import type { AvatarGoal } from "@/lib/avatar-intent";
import { getPromptSuggestions } from "@/lib/prompt-suggestions";
import { cn } from "@/lib/utils";

/**
 * Provider-tuned starter prompts. Clicking a chip inserts the example prompt
 * into the description field so users can refine it instead of starting blank.
 */
export function PromptSuggestions({
  provider,
  mode,
  styleId,
  goal,
  onSelect,
  className,
}: {
  provider: ProviderId;
  mode?: GenerationMode;
  styleId?: string;
  goal?: AvatarGoal;
  onSelect: (text: string) => void;
  className?: string;
}) {
  const t = useTranslations("Suggestions");
  const suggestions = getPromptSuggestions({ provider, mode, styleId, goal });

  if (suggestions.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs font-medium text-muted-foreground">
        {t("label")}
      </span>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            onClick={() => onSelect(suggestion.text)}
            title={suggestion.text}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t(suggestion.labelKey ?? suggestion.id)}
          </button>
        ))}
      </div>
    </div>
  );
}
