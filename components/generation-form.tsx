"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { KeyRound, Settings2, Sparkles } from "lucide-react";

import {
  DEFAULT_MODE_BY_SOURCE,
  MODES_BY_SOURCE,
  isCoupleMode,
  sourceForMode,
  type GenerationMode,
  type ImageSize,
  type InputSource,
} from "@/lib/constants";
import { useSessionApiKey } from "@/lib/use-session-key";
import { useProviderSession } from "@/lib/use-provider-session";
import { useGenerationHistory } from "@/lib/use-generation-history";
import { useGenerationRequest } from "@/lib/use-generation-request";
import {
  addGenerationCandidates,
  createGenerationSession,
  hasGenerationCandidate,
  parentGenerationCandidate,
  selectGenerationCandidate,
  selectedGenerationCandidate,
} from "@/lib/generation-session";
import {
  applyConstrainedEditAction,
  editIntentForAction,
  editIntentForConstrainedAction,
  editIntentFromText,
  isEditPlanReady,
  type ConstrainedEditAction,
  type EditIntent,
} from "@/lib/edit-intent";
import { generatedImageToFile } from "@/lib/generated-image-file";
import {
  formFromIntent,
  useAvatarIntentForm,
  type IntentForm,
} from "@/lib/use-avatar-intent-form";
import { decodePreset, type TeamPreset } from "@/lib/preset";
import {
  capabilitiesForProvider,
  defaultSizeForProvider,
  modelLabelForProvider,
  pricingUrlForProvider,
  resolveEditStrategy,
  sizesForProvider,
} from "@/lib/provider-capabilities";
import {
  canAcceptMultiReference,
  canAcceptSameFrameComposite,
  maxReferencesForCapabilities,
} from "@/lib/reference-intake";
import {
  applyGoalPreset,
  applyRefinementAction,
  createAvatarIntent,
  generationCountForIntent,
  isSameFrameCouple,
  type AvatarGoal,
  type AvatarIntent,
  type RefinementAction,
} from "@/lib/avatar-intent";
import { applyBriefRefinement, parseBriefToIntent } from "@/lib/avatar-brief";
import { deriveAvatarPlan } from "@/lib/avatar-plan";
import { getStyleById } from "@/styles/avatar-styles";
import { getThemeById, getVariant } from "@/styles/avatar-themes";
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
import {
  ReferenceIntakePanel,
  type ReferenceIntakeValue,
} from "@/components/reference-intake-panel";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
} from "@/components/turnstile-widget";
import { AvatarPlanPanel } from "@/components/avatar-plan-panel";
import { CompiledPromptPanel } from "@/components/compiled-prompt-panel";
import { GenerationHistory } from "@/components/generation-history";
import {
  ResultPreview,
  type GenerationStatus,
  type SourcePreviewImage,
} from "@/components/result-preview";

export function GenerationForm() {
  const t = useTranslations("Generate");
  const tf = useTranslations("Form");
  const tp = useTranslations("Provider");
  const tAgent = useTranslations("Agent");
  const tUpload = useTranslations("Upload");
  const tHistory = useTranslations("History");
  const tRef = useTranslations("Reference");

  const searchParams = useSearchParams();

  const { apiKey, setApiKey, saveForSession, toggleSave, clear, hydrated } =
    useSessionApiKey();
  const { provider, setProvider, region, setRegion } = useProviderSession({
    persist: saveForSession && Boolean(apiKey),
    hydrated,
  });
  const history = useGenerationHistory();
  const { status, images, errorCode, lastIntent, run, restore } =
    useGenerationRequest();
  const { form, patch } = useAvatarIntentForm();
  const [generationSession, setGenerationSession] = useState(() =>
    createGenerationSession(),
  );
  /** Draft change/preserve plan reviewed before any paid refinement call. */
  const [pendingEdit, setPendingEdit] = useState<{
    plan: EditIntent;
    candidateId: string;
    intent: AvatarIntent;
  } | null>(null);

  // The intent form is the single source of truth; destructure for reads so the
  // markup stays declarative, and write through thin `patch` wrappers.
  const {
    mode,
    goal,
    styleId,
    themeId,
    variantId,
    userPrompt,
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
  } = form;
  const setMode = (value: GenerationMode) => patch({ mode: value });
  const setStyleId = (value: string | undefined) => patch({ styleId: value });
  const setThemeId = (value: string | undefined) => patch({ themeId: value });
  const setVariantId = (value: string | undefined) =>
    patch({ variantId: value });
  const setUserPrompt = (value: string) => patch({ userPrompt: value });
  const setSameFrame = (value: boolean) => patch({ sameFrame: value });
  const setPairedConsistency = (value: boolean) =>
    patch({ pairedConsistency: value });
  const setSize = (value: ImageSize) => patch({ size: value });

  const [showKey, setShowKey] = useState(false);
  const [brief, setBrief] = useState("");
  const [imageA, setImageA] = useState<UploadedImage | null>(null);
  const [imageB, setImageB] = useState<UploadedImage | null>(null);
  const [imageProfile, setImageProfile] = useState<UploadedImage | null>(null);
  const [imageExpression, setImageExpression] =
    useState<UploadedImage | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(
    undefined,
  );
  const [turnstileReset, setTurnstileReset] = useState(0);

  const source: InputSource = sourceForMode(mode);
  const availableSizes = sizesForProvider(provider);
  const providerCapabilities = capabilitiesForProvider(provider);
  const multiReferenceEnabled = canAcceptMultiReference(providerCapabilities);
  const sameFrameCompositeEnabled = canAcceptSameFrameComposite(
    providerCapabilities,
  );
  const maxReferences = maxReferencesForCapabilities(providerCapabilities);

  useEffect(() => {
    if (!availableSizes.includes(size)) {
      patch({ size: defaultSizeForProvider(provider) });
    }
  }, [availableSizes, provider, size, patch]);

  // Drop optional multi-ref images when the provider cannot accept them.
  useEffect(() => {
    if (multiReferenceEnabled) return;
    if (imageProfile?.previewUrl) URL.revokeObjectURL(imageProfile.previewUrl);
    if (imageExpression?.previewUrl) {
      URL.revokeObjectURL(imageExpression.previewUrl);
    }
    setImageProfile(null);
    setImageExpression(null);
    // Only react to capability flips; avoid re-running on every image change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiReferenceEnabled, provider]);

  // Photo couple same-frame is not executable without verified composite.
  useEffect(() => {
    if (mode === "couple" && sameFrame && !sameFrameCompositeEnabled) {
      patch({ sameFrame: false });
    }
  }, [mode, sameFrame, sameFrameCompositeEnabled, patch]);

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
    patch(formFromIntent(intent));
  }

  function onGoalChange(nextGoal: AvatarGoal) {
    syncIntent(applyGoalPreset(buildIntent(), nextGoal));
  }

  // Deterministic brief → intent: map the free-text brief onto the editable
  // controls. No network or LLM call; the user can still adjust every field.
  function onApplyBrief() {
    const text = brief.trim();
    if (!text) return;
    syncIntent(parseBriefToIntent(buildIntent(), text));
  }

  function onIntentControlChange(controlPatch: Partial<IntentControlValue>) {
    const next: Partial<IntentForm> = {};
    if (controlPatch.likeness) next.likeness = controlPatch.likeness;
    if (controlPatch.creativity) next.creativity = controlPatch.creativity;
    if (controlPatch.composition) next.composition = controlPatch.composition;
    if (controlPatch.background) next.background = controlPatch.background;
    if (typeof controlPatch.palette === "string") {
      next.palette = controlPatch.palette;
    }
    if (typeof controlPatch.mood === "string") next.mood = controlPatch.mood;
    if (typeof controlPatch.accessories === "string") {
      next.accessories = controlPatch.accessories;
    }
    if (typeof controlPatch.avoid === "string") next.avoid = controlPatch.avoid;
    patch(next);
  }

  // Load a shared team preset (non-sensitive base setup) from the URL once.
  useEffect(() => {
    const preset = decodePreset(searchParams.get("preset"));
    const next: Partial<IntentForm> = {};
    if (preset.mode) next.mode = preset.mode;
    if (preset.styleId) next.styleId = preset.styleId;
    if (preset.themeId) next.themeId = preset.themeId;
    if (preset.variantId) next.variantId = preset.variantId;
    if (typeof preset.pairedConsistency === "boolean") {
      next.pairedConsistency = preset.pairedConsistency;
    }
    if (Object.keys(next).length > 0) patch(next);
    if (preset.provider) setProvider(preset.provider);
    if (preset.region) setRegion(preset.region);
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
    (!TURNSTILE_ENABLED || Boolean(turnstileToken)) &&
    (mode === "text" || mode === "couple-text"
      ? Boolean(styleId)
      : mode === "themed"
        ? Boolean(themeId) && Boolean(variantId)
        : mode === "single"
          ? Boolean(imageA) && Boolean(styleId)
          : Boolean(imageA) && Boolean(imageB) && Boolean(styleId));

  function buildGenerateForm(requestIntent: AvatarIntent): FormData {
    const requestMode = requestIntent.mode;
    // Never claim same-frame photo couple without a verified composite path.
    const payloadIntent: AvatarIntent =
      requestMode === "couple"
        ? {
            ...requestIntent,
            sameFrame:
              requestIntent.sameFrame === true && sameFrameCompositeEnabled,
          }
        : requestIntent;
    const formData = new FormData();
    formData.append("provider", provider);
    if (provider === "minimax") formData.append("region", region);
    formData.append("apiKey", apiKey);
    formData.append("mode", requestMode);
    formData.append("size", payloadIntent.size);
    if (payloadIntent.subjectDescription) {
      formData.append("userPrompt", payloadIntent.subjectDescription);
    }
    formData.append("intent", JSON.stringify(payloadIntent));
    if (turnstileToken) formData.append("turnstileToken", turnstileToken);

    if (requestMode === "themed") {
      if (payloadIntent.themeId) {
        formData.append("themeId", payloadIntent.themeId);
      }
      if (payloadIntent.variantId) {
        formData.append("variantId", payloadIntent.variantId);
      }
    } else if (requestMode === "text" || requestMode === "couple-text") {
      if (payloadIntent.styleId) {
        formData.append("styleId", payloadIntent.styleId);
      }
      if (requestMode === "couple-text") {
        formData.append(
          "pairedConsistency",
          String(payloadIntent.pairedConsistency),
        );
      }
    } else {
      if (payloadIntent.styleId) {
        formData.append("styleId", payloadIntent.styleId);
      }
      if (requestMode === "single") {
        if (imageA) formData.append("images", imageA.file, imageA.file.name);
        // Only send extra angles when multi-reference is capability-true.
        if (multiReferenceEnabled) {
          if (imageProfile) {
            formData.append(
              "images",
              imageProfile.file,
              imageProfile.file.name,
            );
          }
          if (imageExpression) {
            formData.append(
              "images",
              imageExpression.file,
              imageExpression.file.name,
            );
          }
        }
      } else if (requestMode === "couple") {
        if (imageA) formData.append("images", imageA.file, imageA.file.name);
        if (imageB) formData.append("images", imageB.file, imageB.file.name);
        formData.append(
          "pairedConsistency",
          String(payloadIntent.pairedConsistency),
        );
      }
    }
    return formData;
  }

  function buildEditForm(
    requestIntent: AvatarIntent,
    selectedImage: File,
    editIntent: EditIntent,
  ): FormData {
    const formData = new FormData();
    formData.append("provider", provider);
    if (provider === "minimax") formData.append("region", region);
    formData.append("apiKey", apiKey);
    formData.append("mode", requestIntent.mode);
    formData.append("operation", "edit");
    formData.append("size", requestIntent.size);
    formData.append("intent", JSON.stringify(requestIntent));
    formData.append("editIntent", JSON.stringify(editIntent));
    formData.append("images", selectedImage, selectedImage.name);
    if (requestIntent.styleId) {
      formData.append("styleId", requestIntent.styleId);
    }
    if (turnstileToken) formData.append("turnstileToken", turnstileToken);
    return formData;
  }

  async function onGenerate(intentOverride?: AvatarIntent) {
    setPendingEdit(null);
    await run({
      intent: intentOverride ?? buildIntent(),
      apiKey,
      buildForm: buildGenerateForm,
      onSuccess: (intent, nextImages) => {
        history.record(intent);
        setGenerationSession(
          addGenerationCandidates(createGenerationSession(), {
            intent,
            images: nextImages,
            operation: "generate",
          }),
        );
      },
    });
    // Turnstile tokens are single-use; force a fresh challenge for the next run.
    if (TURNSTILE_ENABLED) setTurnstileReset((value) => value + 1);
  }

  const selectedCandidate = selectedGenerationCandidate(generationSession);
  const canEditSelectedResult =
    images.length === 1 &&
    Boolean(images[0]?.base64) &&
    Boolean(selectedCandidate) &&
    Boolean((lastIntent ?? buildIntent()).styleId);
  const refinementStrategy = resolveEditStrategy(provider, {
    hasSelectedImageInput: canEditSelectedResult,
    hasContinuation: false,
  });
  const pendingEditView = pendingEdit
    ? {
        plan: pendingEdit.plan,
        // Stale when the draft's parent left the graph or is no longer selected.
        stale:
          !hasGenerationCandidate(
            generationSession,
            pendingEdit.candidateId,
          ) || selectedCandidate?.id !== pendingEdit.candidateId,
      }
    : null;

  async function runRefinement(
    nextIntent: AvatarIntent,
    editIntent: EditIntent,
  ) {
    const parentId = selectedCandidate?.id;
    const selectedImage =
      refinementStrategy === "image-edit" && images[0]
        ? generatedImageToFile(images[0])
        : null;
    const operation = selectedImage ? "edit" : "regenerate";

    await run({
      intent: nextIntent,
      apiKey,
      preserveExistingImages: true,
      buildForm: selectedImage
        ? (intent) => buildEditForm(intent, selectedImage, editIntent)
        : buildGenerateForm,
      onSuccess: (intent, nextImages) => {
        history.record(intent);
        setGenerationSession((session) =>
          addGenerationCandidates(session, {
            intent,
            images: nextImages,
            operation,
            parentId,
            editIntent,
          }),
        );
      },
    });
    if (TURNSTILE_ENABLED) setTurnstileReset((value) => value + 1);
  }

  /** Open the editable pre-call plan; the paid call waits for confirm. */
  function openEditPlan(nextIntent: AvatarIntent, plan: EditIntent) {
    const candidateId = selectedCandidate?.id;
    if (!candidateId) return;
    setPendingEdit({ plan, candidateId, intent: nextIntent });
  }

  function onRefine(action: RefinementAction) {
    openEditPlan(
      applyRefinementAction(buildIntent(), action),
      editIntentForAction(action),
    );
  }

  // Natural-language refinement drafts a plan; confirm triggers one provider call.
  function onRefineText(text: string) {
    const plan = editIntentFromText(text);
    if (!plan) return;
    openEditPlan(applyBriefRefinement(buildIntent(), text), plan);
  }

  function onEditPlanChange(plan: EditIntent) {
    setPendingEdit((current) =>
      current ? { ...current, plan } : current,
    );
  }

  function onConstrainedAction(action: ConstrainedEditAction) {
    setPendingEdit((current) => {
      if (!current) {
        const candidateId = selectedCandidate?.id;
        if (!candidateId) return current;
        return {
          plan: editIntentForConstrainedAction(action),
          candidateId,
          intent: buildIntent(),
        };
      }
      return {
        ...current,
        plan: applyConstrainedEditAction(current.plan, action),
      };
    });
  }

  function onCancelEditPlan() {
    setPendingEdit(null);
  }

  function onConfirmEditPlan() {
    if (!pendingEdit || !isEditPlanReady(pendingEdit.plan)) return;
    // Stale context: refuse the paid call; the panel shows a stale notice.
    if (
      !hasGenerationCandidate(generationSession, pendingEdit.candidateId) ||
      selectedCandidate?.id !== pendingEdit.candidateId
    ) {
      return;
    }
    const { intent, plan } = pendingEdit;
    setPendingEdit(null);
    syncIntent(intent);
    void runRefinement(intent, plan);
  }

  function onSelectCandidate(candidateId: string) {
    const candidate = generationSession.candidates.find(
      (item) => item.id === candidateId,
    );
    if (!candidate) return;
    setGenerationSession((session) =>
      selectGenerationCandidate(session, candidateId),
    );
    restore([candidate.image], candidate.intent);
    syncIntent(candidate.intent);
    // Keep any open draft so the plan panel can show a stale notice when the
    // selected candidate no longer matches the draft parent.
  }

  function onRestorePrevious() {
    const parent = parentGenerationCandidate(generationSession);
    if (!parent) return;
    onSelectCandidate(parent.id);
  }

  // Clearing the key also offers to clear local history, since both are
  // browser-local user data (Epic 9.2).
  function handleClearKey() {
    clear();
    if (
      history.entries.length > 0 &&
      typeof window !== "undefined" &&
      window.confirm(tHistory("clearOnKeyClear"))
    ) {
      history.clear();
    }
  }

  const promptIsPrimary = mode === "text" || mode === "couple-text";
  const previewStatus: GenerationStatus =
    status === "idle" && canGenerate ? "ready" : status;
  const showTeamPresetShare =
    mode === "themed" || isCoupleMode(mode) || goal === "team-character";
  // Single source of truth for the current intent used by the read-only
  // previews (plan, call count, compiled prompt).
  const previewIntent = buildIntent();
  // Couple-text same-frame renders a single combined image instead of an A/B pair.
  const coupleSameFrame = isSameFrameCouple(previewIntent);
  const generationCount = generationCountForIntent(previewIntent);
  const avatarPlan = deriveAvatarPlan(previewIntent, {
    style: getStyleById(styleId),
    theme: getThemeById(themeId),
    variant: getVariant(themeId, variantId),
  });
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
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-4">
              <Label htmlFor="brief">{tAgent("briefLabel")}</Label>
              <Textarea
                id="brief"
                value={brief}
                placeholder={tAgent("briefPlaceholder")}
                onChange={(event) => setBrief(event.target.value)}
                className="min-h-16 resize-y"
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!brief.trim()}
                  onClick={onApplyBrief}
                >
                  {tAgent("briefApply")}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {tAgent("briefHint")}
                </p>
              </div>
            </div>

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
                <ReferenceIntakePanel
                  value={{
                    front: imageA,
                    profile: imageProfile,
                    expression: imageExpression,
                  } satisfies ReferenceIntakeValue}
                  onChange={(next) => {
                    setImageA(next.front);
                    setImageProfile(next.profile);
                    setImageExpression(next.expression);
                  }}
                  multiEnabled={multiReferenceEnabled}
                  maxReferences={maxReferences}
                  providerLabel={tp(provider)}
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
                <label
                  className={`flex items-center gap-2 text-sm ${
                    sameFrameCompositeEnabled
                      ? "text-muted-foreground"
                      : "text-muted-foreground/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={sameFrame && sameFrameCompositeEnabled}
                    disabled={!sameFrameCompositeEnabled}
                    onChange={(event) => setSameFrame(event.target.checked)}
                    className="h-4 w-4 rounded border-input"
                    aria-describedby={
                      sameFrameCompositeEnabled
                        ? undefined
                        : "photo-same-frame-note"
                    }
                  />
                  {tf("sameFrame")}
                </label>
                {!sameFrameCompositeEnabled && (
                  <p
                    id="photo-same-frame-note"
                    className="text-xs text-muted-foreground"
                    role="note"
                  >
                    {tRef("sameFrameUnsupported", {
                      provider: tp(provider),
                    })}
                  </p>
                )}
                {(!sameFrame || !sameFrameCompositeEnabled) && (
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
                    intent: previewIntent,
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
            {TURNSTILE_ENABLED && (
              <div className="flex flex-col gap-2">
                <Label>{tf("verifyLabel")}</Label>
                <p className="text-sm text-muted-foreground">
                  {tf("verifyHint")}
                </p>
                <TurnstileWidget
                  onToken={setTurnstileToken}
                  resetSignal={turnstileReset}
                />
              </div>
            )}
          </section>

          <AvatarPlanPanel plan={avatarPlan} />

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

          {history.entries.length > 0 && (
            <div className="mt-6">
              <GenerationHistory
                entries={history.entries}
                onRestore={syncIntent}
                onClear={history.clear}
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
            candidates={generationSession.candidates}
            selectedCandidateId={generationSession.selectedCandidateId}
            pendingEdit={pendingEditView}
            onRetry={() => void onGenerate(lastIntent ?? buildIntent())}
            onRefine={onRefine}
            onRefineText={onRefineText}
            onSelectCandidate={onSelectCandidate}
            onRestorePrevious={
              parentGenerationCandidate(generationSession)
                ? onRestorePrevious
                : undefined
            }
            onEditPlanChange={onEditPlanChange}
            onConfirmEditPlan={onConfirmEditPlan}
            onCancelEditPlan={onCancelEditPlan}
            onConstrainedAction={onConstrainedAction}
            refinementDisabled={!canGenerate || status === "generating"}
            refinementStrategy={refinementStrategy}
          />
        </CardContent>
      </Card>
    </div>
  );
}
