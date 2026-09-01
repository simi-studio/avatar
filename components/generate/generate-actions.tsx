"use client";

import { useTranslations } from "next-intl";

import type { ImageSize, ProviderId } from "@/lib/constants";
import {
  modelLabelForProvider,
  pricingUrlForProvider,
} from "@/lib/provider-capabilities";
import type { TeamPreset } from "@/lib/preset";
import { Button } from "@/components/ui/button";
import { TeamPresetShare } from "@/components/team-preset-share";

export function GenerateActions({
  canGenerate,
  generating,
  generationCount,
  provider,
  size,
  showTeamPresetShare,
  preset,
}: {
  canGenerate: boolean;
  generating: boolean;
  generationCount: number;
  provider: ProviderId;
  size: ImageSize;
  showTeamPresetShare: boolean;
  preset: TeamPreset;
}) {
  const t = useTranslations("Generate");
  const tf = useTranslations("Form");
  const tp = useTranslations("Provider");

  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {canGenerate ? tf("readyToGenerate") : tf("finishRequired")}
          </p>
          <p className="text-xs text-muted-foreground">
            {generationCount === 1
              ? t("estimatedCostSingle")
              : t("estimatedCostPair")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("callPlan", {
              provider: tp(provider),
              model: modelLabelForProvider(provider),
              size,
            })}{" "}
            <a
              href={pricingUrlForProvider(provider)}
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("pricingLink", { provider: tp(provider) })}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">{t("privacyNote")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={!canGenerate || generating}
            aria-busy={generating}
            size="lg"
            className="w-full sm:w-auto"
          >
            {generating ? t("generating") : t("generate")}
          </Button>
          {showTeamPresetShare && <TeamPresetShare preset={preset} />}
        </div>
      </div>
    </div>
  );
}
