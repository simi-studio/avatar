"use client";

import { useTranslations } from "next-intl";
import { Settings2 } from "lucide-react";

import {
  DEFAULT_MODE_BY_SOURCE,
  MODES_BY_SOURCE,
  type GenerationMode,
  type ImageSize,
  type InputSource,
  type ProviderId,
} from "@/lib/constants";
import type { AvatarGoal, AvatarIntent } from "@/lib/avatar-intent";
import { compileAvatarPrompt } from "@/lib/prompt-compiler";
import { getStyleById } from "@/styles/avatar-styles";
import { getThemeById, getVariant } from "@/styles/avatar-themes";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  IntentControls,
  type IntentControlValue,
} from "@/components/intent-controls";
import { SourceSelector } from "@/components/source-selector";
import { ModeSelector } from "@/components/mode-selector";
import { StylePicker } from "@/components/style-picker";
import { ThemePicker } from "@/components/theme-picker";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import { ImageUploader, type UploadedImage } from "@/components/image-uploader";
import {
  ReferenceIntakePanel,
  type ReferenceIntakeValue,
} from "@/components/reference-intake-panel";
import { CompiledPromptPanel } from "@/components/compiled-prompt-panel";

export function CreativeSetup({
  source,
  mode,
  moreWaysOpen,
  onSourceChange,
  onModeChange,
  onToggleMoreWays,
  styleId,
  onStyleIdChange,
  themeId,
  variantId,
  onThemeIdChange,
  onVariantIdChange,
  sameFrame,
  onSameFrameChange,
  pairedConsistency,
  onPairedConsistencyChange,
  sameFrameCompositeEnabled,
  imageA,
  imageB,
  imageProfile,
  imageExpression,
  onImageAChange,
  onImageBChange,
  onReferenceChange,
  multiReferenceEnabled,
  maxReferences,
  provider,
  userPrompt,
  onUserPromptChange,
  promptIsPrimary,
  goal,
  advancedOpen,
  onToggleAdvanced,
  intentControlValue,
  onGoalChange,
  onIntentControlChange,
  size,
  onSizeChange,
  availableSizes,
  previewIntent,
}: {
  source: InputSource;
  mode: GenerationMode;
  moreWaysOpen: boolean;
  onSourceChange: (source: InputSource) => void;
  onModeChange: (mode: GenerationMode) => void;
  onToggleMoreWays: () => void;
  styleId?: string;
  onStyleIdChange: (styleId: string | undefined) => void;
  themeId?: string;
  variantId?: string;
  onThemeIdChange: (themeId: string | undefined) => void;
  onVariantIdChange: (variantId: string | undefined) => void;
  sameFrame: boolean;
  onSameFrameChange: (value: boolean) => void;
  pairedConsistency: boolean;
  onPairedConsistencyChange: (value: boolean) => void;
  sameFrameCompositeEnabled: boolean;
  imageA: UploadedImage | null;
  imageB: UploadedImage | null;
  imageProfile: UploadedImage | null;
  imageExpression: UploadedImage | null;
  onImageAChange: (image: UploadedImage | null) => void;
  onImageBChange: (image: UploadedImage | null) => void;
  onReferenceChange: (value: ReferenceIntakeValue) => void;
  multiReferenceEnabled: boolean;
  maxReferences: number;
  provider: ProviderId;
  userPrompt: string;
  onUserPromptChange: (value: string) => void;
  promptIsPrimary: boolean;
  goal: AvatarGoal;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
  intentControlValue: IntentControlValue;
  onGoalChange: (goal: AvatarGoal) => void;
  onIntentControlChange: (value: Partial<IntentControlValue>) => void;
  size: ImageSize;
  onSizeChange: (size: ImageSize) => void;
  availableSizes: readonly ImageSize[];
  previewIntent: AvatarIntent;
}) {
  const tf = useTranslations("Form");
  const tp = useTranslations("Provider");
  const tUpload = useTranslations("Upload");
  const tRef = useTranslations("Reference");

  return (
    <>
      <section
        className="flex flex-col gap-5"
        aria-label={tf("creativeSetup")}
      >
        <SourceSelector value={source} onChange={onSourceChange} />
        {(moreWaysOpen || mode !== DEFAULT_MODE_BY_SOURCE[source]) && (
          <ModeSelector
            modes={MODES_BY_SOURCE[source]}
            value={mode}
            onChange={onModeChange}
          />
        )}
        {mode === DEFAULT_MODE_BY_SOURCE[source] && (
          <button
            type="button"
            className="self-start text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={onToggleMoreWays}
          >
            {moreWaysOpen ? tf("hideMoreWays") : tf("moreWays")}
          </button>
        )}

        {mode === "text" && (
          <StylePicker value={styleId} onChange={onStyleIdChange} />
        )}

        {mode === "couple-text" && (
          <>
            <StylePicker value={styleId} onChange={onStyleIdChange} />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={sameFrame}
                onChange={(event) => onSameFrameChange(event.target.checked)}
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
                    onPairedConsistencyChange(event.target.checked)
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
              }}
              onChange={onReferenceChange}
              multiEnabled={multiReferenceEnabled}
              maxReferences={maxReferences}
              providerLabel={tp(provider)}
            />
            <StylePicker value={styleId} onChange={onStyleIdChange} />
          </>
        )}

        {mode === "couple" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageUploader
                label={tUpload("labelA")}
                value={imageA}
                onChange={onImageAChange}
              />
              <ImageUploader
                label={tUpload("labelB")}
                value={imageB}
                onChange={onImageBChange}
              />
            </div>
            <StylePicker value={styleId} onChange={onStyleIdChange} />
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
                onChange={(event) => onSameFrameChange(event.target.checked)}
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
                    onPairedConsistencyChange(event.target.checked)
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
              onThemeIdChange(value);
              onVariantIdChange(undefined);
            }}
            onVariantChange={onVariantIdChange}
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
            onChange={(event) => onUserPromptChange(event.target.value)}
            className="min-h-20 resize-y"
          />
          {promptIsPrimary && (
            <PromptSuggestions
              provider={provider}
              mode={mode}
              styleId={styleId}
              goal={goal}
              onSelect={onUserPromptChange}
            />
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
        <button
          type="button"
          className="flex items-center justify-between gap-3 text-left text-sm font-medium"
          aria-expanded={advancedOpen}
          onClick={onToggleAdvanced}
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
                  onSizeChange(event.target.value as ImageSize)
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
    </>
  );
}
