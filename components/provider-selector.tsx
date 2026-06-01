"use client";

import { useTranslations } from "next-intl";

import {
  MINIMAX_REGIONS,
  PROVIDERS,
  type MiniMaxRegion,
  type ProviderId,
} from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ProviderSelector({
  provider,
  onProviderChange,
  region,
  onRegionChange,
}: {
  provider: ProviderId;
  onProviderChange: (provider: ProviderId) => void;
  region: MiniMaxRegion;
  onRegionChange: (region: MiniMaxRegion) => void;
}) {
  const t = useTranslations("Provider");

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="provider">{t("label")}</Label>
      <Select
        id="provider"
        value={provider}
        onChange={(event) => onProviderChange(event.target.value as ProviderId)}
      >
        {PROVIDERS.map((id) => (
          <option key={id} value={id}>
            {t(id)}
          </option>
        ))}
      </Select>

      {provider === "minimax" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="region">{t("region")}</Label>
          <Select
            id="region"
            value={region}
            onChange={(event) =>
              onRegionChange(event.target.value as MiniMaxRegion)
            }
          >
            {MINIMAX_REGIONS.map((id) => (
              <option key={id} value={id}>
                {id === "global" ? t("regionGlobal") : t("regionChina")}
              </option>
            ))}
          </Select>
          <p className="text-xs text-muted-foreground">{t("regionHint")}</p>
        </div>
      )}
    </div>
  );
}
