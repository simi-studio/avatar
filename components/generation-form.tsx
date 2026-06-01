"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ModeSelector } from "@/components/mode-selector";
import { ProviderSelector } from "@/components/provider-selector";
import { ApiKeyInput } from "@/components/api-key-input";
import { StylePicker } from "@/components/style-picker";
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

  const [mode, setMode] = useState<GenerationMode>("single");
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [region, setRegion] = useState<MiniMaxRegion>("global");
  const [showKey, setShowKey] = useState(false);
  const { apiKey, setApiKey, saveForSession, toggleSave, clear } =
    useSessionApiKey();

  const [imageA, setImageA] = useState<UploadedImage | null>(null);
  const [styleId, setStyleId] = useState<string>();
  const [userPrompt, setUserPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>(DEFAULT_IMAGE_SIZE);

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const canGenerate =
    mode === "single" && Boolean(apiKey) && Boolean(imageA) && Boolean(styleId);

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
    if (styleId) form.append("styleId", styleId);
    if (userPrompt.trim()) form.append("userPrompt", userPrompt.trim());
    if (imageA) form.append("images", imageA.file, imageA.file.name);

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
                label={t("inputHeading")}
                value={imageA}
                onChange={setImageA}
              />
              <StylePicker value={styleId} onChange={setStyleId} />
            </>
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

          <Button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || status === "generating"}
          >
            {status === "generating" ? t("generating") : t("generate")}
          </Button>
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
