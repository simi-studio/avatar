"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { GenerationMode } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModeSelector } from "@/components/mode-selector";

/**
 * Generation form shell. Holds the active mode and renders idle input/preview
 * regions. Inputs and the provider closed loop are wired up in later epics.
 */
export function GenerationForm() {
  const t = useTranslations("Generate");
  const [mode, setMode] = useState<GenerationMode>("single");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{t("inputHeading")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ModeSelector value={mode} onChange={setMode} />
          <p className="text-sm text-muted-foreground">{t("states.idle")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("previewHeading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            {t("states.idle")}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
