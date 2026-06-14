"use client";

import { useTranslations } from "next-intl";
import { Download, Loader2, AlertCircle } from "lucide-react";

import type { ErrorCode, GeneratedImage } from "@/lib/types";
import { REFINEMENT_ACTIONS, type RefinementAction } from "@/lib/avatar-intent";
import { Button } from "@/components/ui/button";

export type GenerationStatus =
  | "idle"
  | "uploading"
  | "ready"
  | "generating"
  | "success"
  | "error";

/** Build a usable <img> src from a generated image (base64 or url). */
export function imageSrc(image: GeneratedImage): string {
  if (image.base64) return `data:${image.mimeType};base64,${image.base64}`;
  return image.url ?? "";
}

export type SourcePreviewImage = {
  label?: string;
  previewUrl: string;
};

function extensionFor(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

export function ResultPreview({
  status,
  images,
  errorCode,
  sourceImages = [],
  onRetry,
  onRefine,
  refinementDisabled = false,
}: {
  status: GenerationStatus;
  images: GeneratedImage[];
  errorCode: ErrorCode | null;
  sourceImages?: SourcePreviewImage[];
  onRetry?: () => void;
  onRefine?: (action: RefinementAction) => void;
  refinementDisabled?: boolean;
}) {
  const tc = useTranslations("Common");
  const t = useTranslations("Generate");
  const tr = useTranslations("Result");
  const tErr = useTranslations("Errors");
  const tRefine = useTranslations("Refinement");

  function download(image: GeneratedImage, index: number) {
    const link = document.createElement("a");
    link.href = imageSrc(image);
    const suffix = image.label
      ? `-${image.label}`
      : index > 0
        ? `-${index}`
        : "";
    link.download = `simi-avatar${suffix}.${extensionFor(image.mimeType)}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  if (status === "generating") {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden />
        {t("states.generating")}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive"
      >
        <AlertCircle className="h-6 w-6" aria-hidden />
        {errorCode ? tErr(errorCode) : t("states.error")}
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {tc("retry")}
          </Button>
        )}
      </div>
    );
  }

  if (status === "success" && images.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <figure
              key={`${image.label ?? index}`}
              className="flex flex-col gap-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc(image)}
                alt={
                  image.label
                    ? tr("altLabeled", { label: image.label })
                    : tr("altSingle")
                }
                className="w-full rounded-lg border"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => download(image, index)}
              >
                <Download className="h-4 w-4" aria-hidden />
                {t("download")}
                {image.label ? ` ${image.label}` : ""}
              </Button>
            </figure>
          ))}
        </div>
        {onRefine && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <span className="text-xs font-medium text-muted-foreground">
              {tRefine("label")}
            </span>
            <div className="flex flex-wrap gap-2">
              {REFINEMENT_ACTIONS.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={refinementDisabled}
                  onClick={() => onRefine(action)}
                >
                  {tRefine(action)}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {tRefine("costNote")}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"
      >
        {tr("emptySuccess")}
      </div>
    );
  }

  if (sourceImages.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {sourceImages.map((image, index) => (
            <figure key={`${image.label ?? index}`} className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt={
                  sourceImages.length === 1
                    ? tr("sourceAltSingle")
                    : tr("sourceAltLabeled", { label: image.label ?? index + 1 })
                }
                className="h-56 w-full rounded-lg border object-cover"
              />
              {image.label && (
                <figcaption className="text-xs text-muted-foreground">
                  {tr("sourceLabel", { label: image.label })}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {status === "ready" ? t("states.ready") : t("states.idle")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
      {tr("empty")}
    </div>
  );
}
