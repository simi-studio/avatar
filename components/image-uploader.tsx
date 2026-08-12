"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, X } from "lucide-react";

import {
  ACCEPTED_IMAGE_TYPES,
  MIN_IMAGE_DIMENSION,
  type ErrorCode,
} from "@/lib/constants";
import {
  readImageDimensions,
  sampleImageLuminance,
  stripExifAndCompress,
} from "@/lib/image-utils";
import {
  assessReferenceGeometry,
  primarySoftIssue,
} from "@/lib/reference-intake";
import { validateImageFile } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type UploadedImage = {
  file: File;
  previewUrl: string;
};

export function ImageUploader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
}) {
  const t = useTranslations("Upload");
  const tErr = useTranslations("Errors");
  const inputRef = useRef<HTMLInputElement>(null);
  const processingSequence = useRef(0);
  const inputId = useId();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);
  const [softHint, setSoftHint] = useState<string | null>(null);

  async function handleFile(file: File) {
    const operationId = processingSequence.current + 1;
    processingSequence.current = operationId;
    setError(null);
    setSoftHint(null);
    const typeOrSize = validateImageFile(file);
    if (typeOrSize) {
      setError(typeOrSize);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setProcessing(true);
    try {
      const { width, height } = await readImageDimensions(file);
      if (processingSequence.current !== operationId) return;
      if (width < MIN_IMAGE_DIMENSION || height < MIN_IMAGE_DIMENSION) {
        setError("INVALID_IMAGE");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      let meanLuma: number | undefined;
      try {
        meanLuma = await sampleImageLuminance(file);
      } catch {
        meanLuma = undefined;
      }
      if (processingSequence.current !== operationId) return;
      const geometry = assessReferenceGeometry(
        width,
        height,
        file.size,
        meanLuma,
      );
      if (!geometry.acceptable) {
        // Extreme aspect / invalid geometry: reject before EXIF strip work.
        setError("INVALID_IMAGE");
        if (inputRef.current) inputRef.current.value = "";
        return;
      }
      const processed = await stripExifAndCompress(file);
      if (processingSequence.current !== operationId) return;
      if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
      onChange({ file: processed, previewUrl: URL.createObjectURL(processed) });
      const soft = primarySoftIssue(geometry.softIssues);
      if (soft === "underexposed") setSoftHint(t("softHintDark"));
      else if (soft === "overexposed") setSoftHint(t("softHintBright"));
      else if (soft === "below-recommended-size") setSoftHint(t("softHintSmall"));
      else if (soft === "very-wide-or-tall") setSoftHint(t("softHintAspect"));
    } catch {
      if (processingSequence.current === operationId) {
        setError("INVALID_IMAGE");
        if (inputRef.current) inputRef.current.value = "";
      }
    } finally {
      if (processingSequence.current === operationId) setProcessing(false);
    }
  }

  function clear() {
    processingSequence.current += 1;
    setProcessing(false);
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    setError(null);
    setSoftHint(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={inputId}>{label}</Label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        disabled={processing}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {value ? (
        <div className="relative w-full overflow-hidden rounded-lg border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value.previewUrl}
            alt={label}
            className="h-48 w-full object-cover"
          />
          <button
            type="button"
            onClick={clear}
            aria-label={t("remove")}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label={label}
          disabled={processing}
          onClick={() => inputRef.current?.click()}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ImagePlus className="h-6 w-6" aria-hidden />
          {processing ? t("processing") : t("choose")}
        </button>
      )}

      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      {softHint && !error && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{softHint}</p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {tErr(error)}
        </p>
      )}

      {value && (
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          {t("remove")}
        </Button>
      )}
    </div>
  );
}
