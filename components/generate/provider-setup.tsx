"use client";

import { useTranslations } from "next-intl";
import { KeyRound } from "lucide-react";

import type { MiniMaxRegion, ProviderId } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { ProviderSelector } from "@/components/provider-selector";
import { ApiKeyInput } from "@/components/api-key-input";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from "@/components/turnstile-widget";

export function ProviderSetup({
  provider,
  onProviderChange,
  region,
  onRegionChange,
  apiKey,
  onApiKeyChange,
  onClearKey,
  saveForSession,
  onToggleSave,
  showKey,
  onToggleShowKey,
  onTurnstileToken,
  turnstileReset,
}: {
  provider: ProviderId;
  onProviderChange: (provider: ProviderId) => void;
  region: MiniMaxRegion;
  onRegionChange: (region: MiniMaxRegion) => void;
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  onClearKey: () => void;
  saveForSession: boolean;
  onToggleSave: (save: boolean) => void;
  showKey: boolean;
  onToggleShowKey: () => void;
  onTurnstileToken: (token: string | undefined) => void;
  turnstileReset: number;
}) {
  const tf = useTranslations("Form");

  return (
    <section
      className="flex flex-col gap-4 rounded-lg border bg-background p-4 shadow-sm"
      aria-label={tf("providerSetup")}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
          <KeyRound className="h-4 w-4" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold">{tf("providerSetup")}</h2>
          <p className="text-sm text-muted-foreground">
            {tf("providerSetupHint")}
          </p>
        </div>
      </div>
      <ProviderSelector
        provider={provider}
        onProviderChange={onProviderChange}
        region={region}
        onRegionChange={onRegionChange}
      />
      <ApiKeyInput
        value={apiKey}
        onChange={onApiKeyChange}
        onClear={onClearKey}
        saveForSession={saveForSession}
        onToggleSave={onToggleSave}
        show={showKey}
        onToggleShow={onToggleShowKey}
      />
      {TURNSTILE_ENABLED && (
        <div className="flex flex-col gap-2">
          <Label>{tf("verifyLabel")}</Label>
          <p className="text-sm text-muted-foreground">{tf("verifyHint")}</p>
          <TurnstileWidget
            onToken={onTurnstileToken}
            resetSignal={turnstileReset}
          />
        </div>
      )}
    </section>
  );
}
