"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  CLIENT_TIMEOUT_MS,
  DEFAULT_IMAGE_SIZE,
  IMAGE_SIZES,
  type ErrorCode,
  type GenerationMode,
  type ImageSize,
  type MiniMaxRegion,
  type ProviderId,
} from "@/lib/constants";
import type { GeneratedImage, GenerateResponse } from "@/lib/types";
import { useSessionApiKey } from "@/lib/use-session-key";
import { decodePreset, type TeamPreset } from "@/lib/preset";
import { AVATAR_THEMES } from "@/styles/avatar-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ModeSelector } from "@/components/mode-selector";
import { ProviderSelector } from "@/components/provider-selector";
import { ApiKeyInput } from "@/components/api-key-input";
import { StylePicker } from "@/components/style-picker";
import { ThemePicker } from "@/components/theme-picker";
import { TeamPresetShare } from "@/components/team-preset-share";
import {
  ImageUploader,
  type UploadedImage,
} from "@/components/image-uploader";
import {
  ResultPreview,
  type GenerationStatus,
} from "@/components/result-preview";

export function GenerationForm() {
  const t = useTranslations("Generate");
  const tf = useTranslations("Form");
  const tUpload = useTranslations("Upload");
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<GenerationMode>("single");
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [region, setRegion] = useState<MiniMaxRegion>("global");
  const [showKey, setShowKey] = useState(false);
  const { apiKey, setApiKey, saveForSession, toggleSave, clear } =
    useSessionApiKey();

  const [imageA, setImageA] = useState<UploadedImage | null>(null);
  const [imageB, setImageB] = useState<UploadedImage | null>(null);
  const [styleId, setStyleId] = useState<string>();
  const [themeId, setThemeId] = useState<string | undefined>(
    AVATAR_THEMES[0]?.id,
  );
  const [variantId, setVariantId] = useState<string>();
  const [pairedConsistency, setPairedConsistency] = useState(true);
  const [userPrompt, setUserPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>(DEFAULT_IMAGE_SIZE);

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  // Load a shared team preset (non-sensitive base setup) from the URL once.
  useEffect(() => {
    const preset = decodePreset(searchParams.get("preset"));
    if (preset.mode) setMode(preset.mode);
    if (preset.provider) setProvider(preset.provider);
    if (preset.region) setRegion(preset.region);
    if (preset.styleId) setStyleId(preset.styleId);
    if (preset.themeId) setThemeId(preset.themeId);
    if (preset.variantId) setVariantId(preset.variantId);
    if (typeof preset.pairedConsistency === "boolean") {
      setPairedConsistency(preset.pairedConsistency);
    }
    // Only run on first mount; the URL is the source of truth for presets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPreset: TeamPreset = {
    mode,
    provider,
    region: provider === "minimax" ? region : undefined,
    styleId: mode === "themed" ? undefined : styleId,
    themeId: mode === "themed" ? themeId : undefined,
    variantId: mode === "themed" ? variantId : undefined,
    pairedConsistency: mode === "couple" ? pairedConsistency : undefined,
  };

  const canGenerate =
    Boolean(apiKey) &&
    (mode === "single"
      ? Boolean(imageA) && Boolean(styleId)
      : mode === "couple"
        ? Boolean(imageA) && Boolean(imageB) && Boolean(styleId)
        : Boolean(themeId) && Boolean(variantId));

  async function onGenerate() {
    if (!apiKey) {
      setErrorCode("MISSING_API_KEY");
      setStatus("error");
      return;
    }
    setStatus("generating");
    setErrorCode(null);
    setImages([]);

    const form = new FormData();
    form.append("provider", provider);
    if (provider === "minimax") form.append("region", region);
    form.append("apiKey", apiKey);
    form.append("mode", mode);
    form.append("size", size);
    if (userPrompt.trim()) form.append("userPrompt", userPrompt.trim());

    if (mode === "themed") {
      if (themeId) form.append("themeId", themeId);
      if (variantId) form.append("variantId", variantId);
    } else {
      if (styleId) form.append("styleId", styleId);
      if (imageA) form.append("images", imageA.file, imageA.file.name);
      if (mode === "couple") {
        if (imageB) form.append("images", imageB.file, imageB.file.name);
        form.append("pairedConsistency", String(pairedConsistency));
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const data = (await res.json()) as GenerateResponse;
      if (data.success && data.images) {
        setImages(data.images);
        setStatus("success");
      } else {
        setErrorCode(data.error?.code ?? "UNKNOWN_ERROR");
        setStatus("error");
      }
    } catch (error) {
      setErrorCode(
        error instanceof DOMException && error.name === "AbortError"
          ? "PROVIDER_TIMEOUT"
          : "UNKNOWN_ERROR",
      );
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{t("inputHeading")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <ModeSelector value={mode} onChange={setMode} />
          <ProviderSelector
            provider={provider}
            onProviderChange={setProvider}
            region={region}
            onRegionChange={setRegion}
          />
          <ApiKeyInput
            value={apiKey}
            onChange={setApiKey}
            onClear={clear}
            saveForSession={saveForSession}
            onToggleSave={toggleSave}
            show={showKey}
            onToggleShow={() => setShowKey((v) => !v)}
          />

          {mode === "single" && (
            <>
              <ImageUploader
                label={tUpload("label")}
                value={imageA}
                onChange={setImageA}
              />
              <StylePicker value={styleId} onChange={setStyleId} />
            </>
          )}

          {mode === "couple" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUploader
                  label={tUpload("labelA")}
                  value={imageA}
                  onChange={setImageA}
                />
                <ImageUploader
                  label={tUpload("labelB")}
                  value={imageB}
                  onChange={setImageB}
                />
              </div>
              <StylePicker value={styleId} onChange={setStyleId} />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={pairedConsistency}
                  onChange={(event) =>
                    setPairedConsistency(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-input"
                />
                {tf("pairedConsistency")}
              </label>
              <p className="text-xs text-muted-foreground">
                {t("estimatedCostCouple")}
              </p>
            </>
          )}

          {mode === "themed" && (
            <ThemePicker
              themeId={themeId}
              variantId={variantId}
              onThemeChange={(value) => {
                setThemeId(value);
                setVariantId(undefined);
              }}
              onVariantChange={setVariantId}
            />
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="prompt">{tf("promptLabel")}</Label>
            <Textarea
              id="prompt"
              value={userPrompt}
              placeholder={tf("promptPlaceholder")}
              onChange={(event) => setUserPrompt(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="size">{tf("sizeLabel")}</Label>
            <Select
              id="size"
              value={size}
              onChange={(event) => setSize(event.target.value as ImageSize)}
            >
              {IMAGE_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">{t("privacyNote")}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate || status === "generating"}
            >
              {status === "generating" ? t("generating") : t("generate")}
            </Button>
            <TeamPresetShare preset={currentPreset} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("previewHeading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResultPreview
            status={status}
            images={images}
            errorCode={errorCode}
          />
        </CardContent>
      </Card>
    </div>
  );
}
