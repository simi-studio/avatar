"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  CLIENT_TIMEOUT_MS,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_MODE_BY_SOURCE,
  MODES_BY_SOURCE,
  isCoupleMode,
  sourceForMode,
  type ErrorCode,
  type GenerationMode,
  type ImageSize,
  type InputSource,
  type MiniMaxRegion,
  type ProviderId,
} from "@/lib/constants";
import type { GeneratedImage, GenerateResponse } from "@/lib/types";
import { useSessionApiKey } from "@/lib/use-session-key";
import { decodePreset, type TeamPreset } from "@/lib/preset";
import {
  defaultSizeForProvider,
  sizesForProvider,
} from "@/lib/provider-capabilities";
import {
  GOAL_PRESETS,
  applyGoalPreset,
  applyRefinementAction,
  createAvatarIntent,
  type AvatarBackground,
  type AvatarComposition,
  type AvatarGoal,
  type AvatarIntent,
  type IntentLevel,
  type RefinementAction,
} from "@/lib/avatar-intent";
import { AVATAR_STYLES } from "@/styles/avatar-styles";
import { AVATAR_THEMES } from "@/styles/avatar-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  IntentControls,
  type IntentControlValue,
} from "@/components/intent-controls";
import { SourceSelector } from "@/components/source-selector";
import { ModeSelector } from "@/components/mode-selector";
import { ProviderSelector } from "@/components/provider-selector";
import { ApiKeyInput } from "@/components/api-key-input";
import { StylePicker } from "@/components/style-picker";
import { ThemePicker } from "@/components/theme-picker";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import { TeamPresetShare } from "@/components/team-preset-share";
import { ImageUploader, type UploadedImage } from "@/components/image-uploader";
import {
  ResultPreview,
  type GenerationStatus,
} from "@/components/result-preview";

const DEFAULT_GOAL: AvatarGoal = "professional-profile";
const DEFAULT_GOAL_PRESET = GOAL_PRESETS[DEFAULT_GOAL];

export function GenerationForm() {
  const t = useTranslations("Generate");
  const tf = useTranslations("Form");
  const tUpload = useTranslations("Upload");

  const searchParams = useSearchParams();

  // `text` is the default, lowest-friction entry point: no upload required.
  const [mode, setMode] = useState<GenerationMode>("text");
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [region, setRegion] = useState<MiniMaxRegion>("global");
  const [showKey, setShowKey] = useState(false);
  const { apiKey, setApiKey, saveForSession, toggleSave, clear } =
    useSessionApiKey();

  const [imageA, setImageA] = useState<UploadedImage | null>(null);
  const [imageB, setImageB] = useState<UploadedImage | null>(null);
  const [styleId, setStyleId] = useState<string | undefined>(
    DEFAULT_GOAL_PRESET.styleId ?? AVATAR_STYLES[0]?.id,
  );
  const [themeId, setThemeId] = useState<string | undefined>(
    AVATAR_THEMES[0]?.id,
  );
  const [variantId, setVariantId] = useState<string>();
  const [pairedConsistency, setPairedConsistency] = useState(true);
  const [userPrompt, setUserPrompt] = useState("");
  const [goal, setGoal] = useState<AvatarGoal>(DEFAULT_GOAL);
  const [likeness, setLikeness] = useState<IntentLevel>(
    DEFAULT_GOAL_PRESET.likeness,
  );
  const [creativity, setCreativity] = useState<IntentLevel>(
    DEFAULT_GOAL_PRESET.creativity,
  );
  const [composition, setComposition] = useState<AvatarComposition>(
    DEFAULT_GOAL_PRESET.composition,
  );
  const [background, setBackground] = useState<AvatarBackground>(
    DEFAULT_GOAL_PRESET.background,
  );
  const [palette, setPalette] = useState(DEFAULT_GOAL_PRESET.palette ?? "");
  const [mood, setMood] = useState(DEFAULT_GOAL_PRESET.mood ?? "");
  const [accessories, setAccessories] = useState(
    DEFAULT_GOAL_PRESET.accessories ?? "",
  );
  const [avoid, setAvoid] = useState(DEFAULT_GOAL_PRESET.avoid ?? "");
  const [size, setSize] = useState<ImageSize>(DEFAULT_IMAGE_SIZE);

  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);

  const source: InputSource = sourceForMode(mode);
  const availableSizes = sizesForProvider(provider);

  useEffect(() => {
    if (!availableSizes.includes(size)) {
      setSize(defaultSizeForProvider(provider));
    }
  }, [availableSizes, provider, size]);

  function buildIntent(overrides: Partial<AvatarIntent> = {}): AvatarIntent {
    return createAvatarIntent({
      mode,
      goal,
      styleId,
      themeId,
      variantId,
      subjectDescription: userPrompt,
      likeness,
      creativity,
      composition,
      background,
      palette,
      mood,
      accessories,
      avoid,
      pairedConsistency,
      size,
      ...overrides,
    });
  }

  function syncIntent(intent: AvatarIntent) {
    setMode(intent.mode);
    setGoal(intent.goal);
    setLikeness(intent.likeness);
    setCreativity(intent.creativity);
    setComposition(intent.composition);
    setBackground(intent.background);
    setPalette(intent.palette ?? "");
    setMood(intent.mood ?? "");
    setAccessories(intent.accessories ?? "");
    setAvoid(intent.avoid ?? "");
    setUserPrompt(intent.subjectDescription ?? "");
    setPairedConsistency(intent.pairedConsistency ?? pairedConsistency);
    setSize(intent.size);
    if (intent.styleId) setStyleId(intent.styleId);
    if (intent.themeId) setThemeId(intent.themeId);
    if (intent.variantId) setVariantId(intent.variantId);
  }

  function onGoalChange(nextGoal: AvatarGoal) {
    syncIntent(applyGoalPreset(buildIntent(), nextGoal));
  }

  function onIntentControlChange(patch: Partial<IntentControlValue>) {
    if (patch.likeness) setLikeness(patch.likeness);
    if (patch.creativity) setCreativity(patch.creativity);
    if (patch.composition) setComposition(patch.composition);
    if (patch.background) setBackground(patch.background);
    if (typeof patch.palette === "string") setPalette(patch.palette);
    if (typeof patch.mood === "string") setMood(patch.mood);
    if (typeof patch.accessories === "string") {
      setAccessories(patch.accessories);
    }
    if (typeof patch.avoid === "string") setAvoid(patch.avoid);
  }

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

  // Switch the input source and reset to that source's default sub-mode.
  function onSourceChange(next: InputSource) {
    if (next === source) return;
    setMode(DEFAULT_MODE_BY_SOURCE[next]);
  }

  const currentPreset: TeamPreset = {
    mode,
    provider,
    region: provider === "minimax" ? region : undefined,
    styleId: mode === "themed" ? undefined : styleId,
    themeId: mode === "themed" ? themeId : undefined,
    variantId: mode === "themed" ? variantId : undefined,
    pairedConsistency: isCoupleMode(mode) ? pairedConsistency : undefined,
  };

  const canGenerate =
    Boolean(apiKey) &&
    (mode === "text" || mode === "couple-text"
      ? Boolean(styleId)
      : mode === "themed"
        ? Boolean(themeId) && Boolean(variantId)
        : mode === "single"
          ? Boolean(imageA) && Boolean(styleId)
          : Boolean(imageA) && Boolean(imageB) && Boolean(styleId));

  async function onGenerate(intentOverride?: AvatarIntent) {
    const requestIntent = intentOverride ?? buildIntent();
    const requestMode = requestIntent.mode;

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
    form.append("mode", requestMode);
    form.append("size", requestIntent.size);
    if (requestIntent.subjectDescription) {
      form.append("userPrompt", requestIntent.subjectDescription);
    }
    form.append("intent", JSON.stringify(requestIntent));

    if (requestMode === "themed") {
      if (requestIntent.themeId) form.append("themeId", requestIntent.themeId);
      if (requestIntent.variantId) {
        form.append("variantId", requestIntent.variantId);
      }
    } else if (requestMode === "text" || requestMode === "couple-text") {
      if (requestIntent.styleId) form.append("styleId", requestIntent.styleId);
      if (requestMode === "couple-text") {
        form.append(
          "pairedConsistency",
          String(requestIntent.pairedConsistency),
        );
      }
    } else {
      if (requestIntent.styleId) form.append("styleId", requestIntent.styleId);
      if (imageA) form.append("images", imageA.file, imageA.file.name);
      if (requestMode === "couple") {
        if (imageB) form.append("images", imageB.file, imageB.file.name);
        form.append(
          "pairedConsistency",
          String(requestIntent.pairedConsistency),
        );
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

  function onRefine(action: RefinementAction) {
    const nextIntent = applyRefinementAction(buildIntent(), action);
    syncIntent(nextIntent);
    void onGenerate(nextIntent);
  }

  const promptIsPrimary = mode === "text" || mode === "couple-text";
  const intentControlValue: IntentControlValue = {
    goal,
    likeness,
    creativity,
    composition,
    background,
    palette,
    mood,
    accessories,
    avoid,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{t("inputHeading")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (canGenerate && status !== "generating") {
                void onGenerate();
              }
            }}
          >
          <SourceSelector value={source} onChange={onSourceChange} />
          <ModeSelector
            modes={MODES_BY_SOURCE[source]}
            value={mode}
            onChange={setMode}
          />
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

          <IntentControls
            mode={mode}
            value={intentControlValue}
            onGoalChange={onGoalChange}
            onChange={onIntentControlChange}
          />

          {mode === "text" && (
            <StylePicker value={styleId} onChange={setStyleId} />
          )}

          {mode === "couple-text" && (
            <>
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
            <Label htmlFor="prompt">
              {promptIsPrimary ? tf("descriptionLabel") : tf("promptLabel")}
            </Label>
            <Textarea
              id="prompt"
              value={userPrompt}
              placeholder={
                promptIsPrimary
                  ? tf("descriptionPlaceholder")
                  : tf("promptPlaceholder")
              }
              onChange={(event) => setUserPrompt(event.target.value)}
            />
            {promptIsPrimary && (
              <PromptSuggestions
                provider={provider}
                mode={mode}
                styleId={styleId}
                goal={goal}
                onSelect={setUserPrompt}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="size">{tf("sizeLabel")}</Label>
            <Select
              id="size"
              value={size}
              onChange={(event) => setSize(event.target.value as ImageSize)}
            >
              {availableSizes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">{t("privacyNote")}</p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={!canGenerate || status === "generating"}
            >
              {status === "generating" ? t("generating") : t("generate")}
            </Button>
            <TeamPresetShare preset={currentPreset} />
          </div>
          </form>
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
            onRefine={onRefine}
            refinementDisabled={!canGenerate || status === "generating"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
