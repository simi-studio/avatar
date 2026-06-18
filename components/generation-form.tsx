"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { KeyRound, Settings2, Sparkles } from "lucide-react";

import {
  CLIENT_TIMEOUT_MS,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_MODE_BY_SOURCE,
  MINIMAX_REGIONS,
  MODES_BY_SOURCE,
  PROVIDERS,
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
import { AVATAR_STYLES, getStyleById } from "@/styles/avatar-styles";
import {
  AVATAR_THEMES,
  getThemeById,
  getVariant,
} from "@/styles/avatar-themes";
import { compileAvatarPrompt } from "@/lib/prompt-compiler";
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
import { CompiledPromptPanel } from "@/components/compiled-prompt-panel";
import { GenerationHistory } from "@/components/generation-history";
import {
  addHistoryEntry,
  clearHistory,
  readHistory,
  type HistoryEntry,
} from "@/lib/local-history";
import {
  ResultPreview,
  type GenerationStatus,
  type SourcePreviewImage,
} from "@/components/result-preview";

const DEFAULT_GOAL: AvatarGoal = "professional-profile";
const DEFAULT_GOAL_PRESET = GOAL_PRESETS[DEFAULT_GOAL];
const SESSION_PROVIDER_KEY = "simi-avatar-provider";
const SESSION_REGION_KEY = "simi-avatar-minimax-region";

export function GenerationForm() {
  const t = useTranslations("Generate");
  const tf = useTranslations("Form");
  const tUpload = useTranslations("Upload");
  const tHistory = useTranslations("History");

  const searchParams = useSearchParams();

  // `text` is the default, lowest-friction entry point: no upload required.
  const [mode, setMode] = useState<GenerationMode>("text");
  const [provider, setProvider] = useState<ProviderId>("openai");
  const [region, setRegion] = useState<MiniMaxRegion>("global");
  const [showKey, setShowKey] = useState(false);
  const { apiKey, setApiKey, saveForSession, toggleSave, clear, hydrated } =
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
  const [sameFrame, setSameFrame] = useState(false);
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [lastIntent, setLastIntent] = useState<AvatarIntent | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // History is client-only; hydrate it after mount to avoid SSR mismatch.
  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const source: InputSource = sourceForMode(mode);
  const availableSizes = sizesForProvider(provider);

  useEffect(() => {
    if (!availableSizes.includes(size)) {
      setSize(defaultSizeForProvider(provider));
    }
  }, [availableSizes, provider, size]);

  useEffect(() => {
    try {
      const storedProvider = window.sessionStorage.getItem(SESSION_PROVIDER_KEY);
      const storedRegion = window.sessionStorage.getItem(SESSION_REGION_KEY);
      if (PROVIDERS.includes(storedProvider as ProviderId)) {
        setProvider(storedProvider as ProviderId);
      }
      if (MINIMAX_REGIONS.includes(storedRegion as MiniMaxRegion)) {
        setRegion(storedRegion as MiniMaxRegion);
      }
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (saveForSession && apiKey) {
        window.sessionStorage.setItem(SESSION_PROVIDER_KEY, provider);
        if (provider === "minimax") {
          window.sessionStorage.setItem(SESSION_REGION_KEY, region);
        } else {
          window.sessionStorage.removeItem(SESSION_REGION_KEY);
        }
      } else {
        window.sessionStorage.removeItem(SESSION_PROVIDER_KEY);
        window.sessionStorage.removeItem(SESSION_REGION_KEY);
      }
    } catch {
      // Ignore storage access errors.
    }
  }, [apiKey, hydrated, provider, region, saveForSession]);

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
      sameFrame,
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
    setSameFrame(intent.sameFrame ?? false);
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
    setLastIntent(requestIntent);
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
        setHistory(addHistoryEntry(requestIntent));
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

  function handleClearHistory() {
    clearHistory();
    setHistory([]);
  }

  // Clearing the key also offers to clear local history, since both are
  // browser-local user data (Epic 9.2).
  function handleClearKey() {
    clear();
    if (
      history.length > 0 &&
      typeof window !== "undefined" &&
      window.confirm(tHistory("clearOnKeyClear"))
    ) {
      handleClearHistory();
    }
  }

  const promptIsPrimary = mode === "text" || mode === "couple-text";
  const previewStatus: GenerationStatus =
    status === "idle" && canGenerate ? "ready" : status;
  const showTeamPresetShare =
    mode === "themed" || isCoupleMode(mode) || goal === "team-character";
  // Couple-text same-frame renders a single combined image instead of an A/B pair.
  const coupleSameFrame = mode === "couple-text" && sameFrame;
  const generationCount = isCoupleMode(mode) && !coupleSameFrame ? 2 : 1;
  const sourceImages: SourcePreviewImage[] = [];
  if (mode === "single" && imageA) {
    sourceImages.push({ previewUrl: imageA.previewUrl });
  }
  if (mode === "couple") {
    if (imageA) sourceImages.push({ label: "A", previewUrl: imageA.previewUrl });
    if (imageB) sourceImages.push({ label: "B", previewUrl: imageB.previewUrl });
  }
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>{t("inputHeading")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {tf("creativeSetupHint")}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 p-2 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (canGenerate && status !== "generating") {
                void onGenerate();
              }
            }}
          >
          <section
            className="flex flex-col gap-5"
            aria-label={tf("creativeSetup")}
          >
            <SourceSelector value={source} onChange={onSourceChange} />
            <ModeSelector
              modes={MODES_BY_SOURCE[source]}
              value={mode}
              onChange={setMode}
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
                    checked={sameFrame}
                    onChange={(event) => setSameFrame(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {tf("sameFrame")}
                </label>
                {!sameFrame && (
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
                )}
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
                className="min-h-28 resize-y"
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
          </section>

          <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
            <button
              type="button"
              className="flex items-center justify-between gap-3 text-left text-sm font-medium"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((value) => !value)}
            >
              <span className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" aria-hidden />
                {advancedOpen
                  ? tf("hideAdvancedSettings")
                  : tf("advancedSettings")}
              </span>
            </button>

            {advancedOpen && (
              <div className="flex flex-col gap-4">
                <IntentControls
                  mode={mode}
                  value={intentControlValue}
                  onGoalChange={onGoalChange}
                  onChange={onIntentControlChange}
                />

                <div className="flex flex-col gap-2">
                  <Label htmlFor="size">{tf("sizeLabel")}</Label>
                  <Select
                    id="size"
                    value={size}
                    onChange={(event) =>
                      setSize(event.target.value as ImageSize)
                    }
                  >
                    {availableSizes.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>

                <CompiledPromptPanel
                  request={compileAvatarPrompt({
                    provider,
                    intent: buildIntent(),
                    style: getStyleById(styleId),
                    theme: getThemeById(themeId),
                    variant: getVariant(themeId, variantId),
                  })}
                />
              </div>
            )}
          </div>

          <section
            className="flex flex-col gap-4 rounded-lg border bg-background p-4 shadow-sm"
            aria-label={tf("providerSetup")}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                <KeyRound className="h-4 w-4" aria-hidden />
              </span>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">
                  {tf("providerSetup")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tf("providerSetupHint")}
                </p>
              </div>
            </div>
            <ProviderSelector
              provider={provider}
              onProviderChange={setProvider}
              region={region}
              onRegionChange={setRegion}
            />
            <ApiKeyInput
              value={apiKey}
              onChange={setApiKey}
              onClear={handleClearKey}
              saveForSession={saveForSession}
              onToggleSave={toggleSave}
              show={showKey}
              onToggleShow={() => setShowKey((v) => !v)}
            />
          </section>

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
                  {t("privacyNote")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={!canGenerate || status === "generating"}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {status === "generating" ? t("generating") : t("generate")}
                </Button>
                {showTeamPresetShare && (
                  <TeamPresetShare preset={currentPreset} />
                )}
              </div>
            </div>
          </div>
          </form>

          {history.length > 0 && (
            <div className="mt-6">
              <GenerationHistory
                entries={history}
                onRestore={syncIntent}
                onClear={handleClearHistory}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70 shadow-sm xl:sticky xl:top-20 xl:self-start">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>{t("previewHeading")}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <ResultPreview
            status={previewStatus}
            images={images}
            errorCode={errorCode}
            sourceImages={sourceImages}
            expectedImageLabels={
              isCoupleMode(mode) && !coupleSameFrame ? ["A", "B"] : []
            }
            onRetry={() => void onGenerate(lastIntent ?? buildIntent())}
            onRefine={onRefine}
            refinementDisabled={!canGenerate || status === "generating"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
