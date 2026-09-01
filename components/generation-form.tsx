"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";

import {
  DEFAULT_MODE_BY_SOURCE,
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
  candidateStepGroup,
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
import { getGalleryExample } from "@/lib/gallery";
import { deriveAvatarPlan } from "@/lib/avatar-plan";
import { getStyleById } from "@/styles/avatar-styles";
import { getThemeById, getVariant } from "@/styles/avatar-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type IntentControlValue } from "@/components/intent-controls";
import { type UploadedImage } from "@/components/image-uploader";
import { TURNSTILE_ENABLED } from "@/components/turnstile-widget";
import { AvatarPlanPanel } from "@/components/avatar-plan-panel";
import { GenerationHistory } from "@/components/generation-history";
import { CreativeSetup } from "@/components/generate/creative-setup";
import { ProviderSetup } from "@/components/generate/provider-setup";
import { GenerateActions } from "@/components/generate/generate-actions";
import {
  ResultPreview,
  type GenerationStatus,
  type SourcePreviewImage,
} from "@/components/result-preview";

export function GenerationForm() {
  const t = useTranslations("Generate");
  const tf = useTranslations("Form");
  const tHistory = useTranslations("History");

  const searchParams = useSearchParams();

  const { apiKey, setApiKey, saveForSession, toggleSave, clear, hydrated } =
    useSessionApiKey();
  const { provider, setProvider, region, setRegion } = useProviderSession({
    persist: saveForSession && Boolean(apiKey),
    hydrated,
  });
  const history = useGenerationHistory();
  const { status, images, errorCode, lastIntent, run, restore, reset } =
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
  const [imageA, setImageA] = useState<UploadedImage | null>(null);
  const [imageB, setImageB] = useState<UploadedImage | null>(null);
  const [imageProfile, setImageProfile] = useState<UploadedImage | null>(null);
  const [imageExpression, setImageExpression] =
    useState<UploadedImage | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [moreWaysOpen, setMoreWaysOpen] = useState(false);
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

  // Drop optional multi-ref images when capability or provider limits shrink.
  useEffect(() => {
    const keepProfile = multiReferenceEnabled && maxReferences >= 2;
    const keepExpression = multiReferenceEnabled && maxReferences >= 3;
    if (!keepProfile && imageProfile?.previewUrl) {
      URL.revokeObjectURL(imageProfile.previewUrl);
    }
    if (!keepExpression && imageExpression?.previewUrl) {
      URL.revokeObjectURL(imageExpression.previewUrl);
    }
    if (!keepProfile) setImageProfile(null);
    if (!keepExpression) setImageExpression(null);
    // Only react to capability flips; avoid re-running on every image change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiReferenceEnabled, maxReferences, provider]);

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

  function resetWorkspace() {
    reset();
    setGenerationSession(createGenerationSession());
    setPendingEdit(null);
  }

  function onModeChange(next: GenerationMode) {
    if (next === mode) return;
    setMode(next);
    resetWorkspace();
  }

  function applyExample(exampleId: string) {
    const example = getGalleryExample(exampleId);
    if (!example) return;
    syncIntent(
      createAvatarIntent({
        ...buildIntent(),
        mode: example.mode,
        styleId: example.styleId,
        themeId: example.themeId,
        variantId: example.variantId,
        subjectDescription: example.prompt,
        sameFrame: example.sameFrame === true,
      }),
    );
    if (example.mode !== "text" && example.mode !== "single") {
      setMoreWaysOpen(true);
    }
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

  // Load a shared team preset or gallery example from the URL once.
  useEffect(() => {
    const preset = decodePreset(searchParams.get("preset"));
    const example = getGalleryExample(searchParams.get("example"));
    const next: Partial<IntentForm> = {};
    if (preset.mode) next.mode = preset.mode;
    if (preset.styleId) next.styleId = preset.styleId;
    if (preset.themeId) next.themeId = preset.themeId;
    if (preset.variantId) next.variantId = preset.variantId;
    if (typeof preset.pairedConsistency === "boolean") {
      next.pairedConsistency = preset.pairedConsistency;
    }
    if (example) {
      next.mode = example.mode;
      if (example.styleId) next.styleId = example.styleId;
      if (example.themeId) next.themeId = example.themeId;
      if (example.variantId) next.variantId = example.variantId;
      next.userPrompt = example.prompt;
      next.sameFrame = example.sameFrame === true;
      if (example.mode !== "text" && example.mode !== "single") {
        setMoreWaysOpen(true);
      }
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
    resetWorkspace();
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
        if (imageA) {
          formData.append("images", imageA.file, imageA.file.name);
          if (multiReferenceEnabled) formData.append("referenceRoles", "front");
        }
        // Only send extra angles when multi-reference is capability-true.
        if (multiReferenceEnabled) {
          const optionalReferences = [
            { image: imageProfile, role: "profile" },
            { image: imageExpression, role: "expression" },
          ].slice(0, Math.max(0, maxReferences - 1));
          for (const { image: reference, role } of optionalReferences) {
            if (reference) {
              formData.append(
                "images",
                reference.file,
                reference.file.name,
              );
              formData.append("referenceRoles", role);
            }
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

  function buildRegenerateForm(
    requestIntent: AvatarIntent,
    editIntent: EditIntent,
  ): FormData {
    const formData = buildGenerateForm(requestIntent);
    formData.set("operation", "regenerate");
    formData.set("editIntent", JSON.stringify(editIntent));
    return formData;
  }

  async function onGenerate(intentOverride?: AvatarIntent) {
    setPendingEdit(null);
    const raw = intentOverride ?? buildIntent();
    const intent = intentOverride
      ? raw
      : parseBriefToIntent(raw, raw.subjectDescription ?? "");
    if (!intentOverride && intent !== raw) {
      syncIntent(intent);
    }
    await run({
      intent,
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
    Boolean(selectedCandidate?.image.base64) &&
    providerCapabilities.supportsImageEdit;
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
      refinementStrategy === "image-edit" && selectedCandidate?.image
        ? generatedImageToFile(selectedCandidate.image)
        : null;
    const operation = selectedImage ? "edit" : "regenerate";

    await run({
      intent: nextIntent,
      apiKey,
      preserveExistingImages: true,
      buildForm: selectedImage
        ? (intent) => buildEditForm(intent, selectedImage, editIntent)
        : (intent) => buildRegenerateForm(intent, editIntent),
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
    const group = candidateStepGroup(generationSession, candidateId);
    restore(
      group.map((item) => item.image),
      candidate.intent,
    );
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
  const resultIntent = selectedCandidate?.intent ?? lastIntent ?? previewIntent;
  // Couple-text same-frame renders a single combined image instead of an A/B pair.
  const coupleSameFrame = isSameFrameCouple(resultIntent);
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
      <Card className="overflow-hidden border-border/70 shadow-sm xl:flex xl:max-h-[calc(100vh-13rem)] xl:flex-col">
        <CardHeader className="shrink-0 border-b bg-muted/30">
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
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              if (canGenerate && status !== "generating") {
                void onGenerate();
              }
            }}
          >
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4 sm:p-6">
          <CreativeSetup
            source={source}
            mode={mode}
            moreWaysOpen={moreWaysOpen}
            onSourceChange={onSourceChange}
            onModeChange={onModeChange}
            onToggleMoreWays={() => setMoreWaysOpen((value) => !value)}
            styleId={styleId}
            onStyleIdChange={setStyleId}
            themeId={themeId}
            variantId={variantId}
            onThemeIdChange={setThemeId}
            onVariantIdChange={setVariantId}
            sameFrame={sameFrame}
            onSameFrameChange={setSameFrame}
            pairedConsistency={pairedConsistency}
            onPairedConsistencyChange={setPairedConsistency}
            sameFrameCompositeEnabled={sameFrameCompositeEnabled}
            imageA={imageA}
            imageB={imageB}
            imageProfile={imageProfile}
            imageExpression={imageExpression}
            onImageAChange={setImageA}
            onImageBChange={setImageB}
            onReferenceChange={(next) => {
              setImageA(next.front);
              setImageProfile(next.profile);
              setImageExpression(next.expression);
            }}
            multiReferenceEnabled={multiReferenceEnabled}
            maxReferences={maxReferences}
            provider={provider}
            userPrompt={userPrompt}
            onUserPromptChange={setUserPrompt}
            promptIsPrimary={promptIsPrimary}
            goal={goal}
            advancedOpen={advancedOpen}
            onToggleAdvanced={() => setAdvancedOpen((value) => !value)}
            intentControlValue={intentControlValue}
            onGoalChange={onGoalChange}
            onIntentControlChange={onIntentControlChange}
            size={size}
            onSizeChange={setSize}
            availableSizes={availableSizes}
            previewIntent={previewIntent}
          />
          <ProviderSetup
            provider={provider}
            onProviderChange={setProvider}
            region={region}
            onRegionChange={setRegion}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            onClearKey={handleClearKey}
            saveForSession={saveForSession}
            onToggleSave={toggleSave}
            showKey={showKey}
            onToggleShowKey={() => setShowKey((v) => !v)}
            onTurnstileToken={setTurnstileToken}
            turnstileReset={turnstileReset}
          />

          <AvatarPlanPanel plan={avatarPlan} />
          </div>

          <div className="shrink-0 border-t bg-background/95 p-4">
          <GenerateActions
            canGenerate={canGenerate}
            generating={status === "generating"}
            generationCount={generationCount}
            provider={provider}
            size={size}
            showTeamPresetShare={showTeamPresetShare}
            preset={currentPreset}
          />
          </div>
          </form>

          {history.entries.length > 0 && (
            <div className="border-t px-4 py-4 sm:px-6">
              <GenerationHistory
                entries={history.entries}
                onRestore={(intent) => {
                  resetWorkspace();
                  syncIntent(intent);
                }}
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
              isCoupleMode(resultIntent.mode) && !coupleSameFrame
                ? ["A", "B"]
                : []
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
            refinementDisabled={
              status === "generating" ||
              !(canEditSelectedResult
                ? Boolean(apiKey) && (!TURNSTILE_ENABLED || Boolean(turnstileToken))
                : canGenerate)
            }
            localInteractionDisabled={status === "generating"}
            refinementStrategy={refinementStrategy}
            onApplyExample={applyExample}
          />
        </CardContent>
      </Card>
    </div>
  );
}
