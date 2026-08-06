"use client";

import { useTranslations } from "next-intl";
import { Images, Lock } from "lucide-react";

import type { ReferenceRole } from "@/lib/reference-intake";
import { ImageUploader, type UploadedImage } from "@/components/image-uploader";

export type ReferenceIntakeValue = {
  front: UploadedImage | null;
  profile: UploadedImage | null;
  expression: UploadedImage | null;
};

/**
 * Single-person reference intake (Epic 11.4).
 * Multi-angle slots activate only when the provider capability registry allows
 * multi-reference; otherwise users see an honest single-photo path and a clear
 * unsupported notice (no silent drop of extra images).
 */
export function ReferenceIntakePanel({
  value,
  onChange,
  multiEnabled,
  maxReferences,
  providerLabel,
}: {
  value: ReferenceIntakeValue;
  onChange: (next: ReferenceIntakeValue) => void;
  multiEnabled: boolean;
  maxReferences: number;
  providerLabel: string;
}) {
  const t = useTranslations("Reference");
  const tUpload = useTranslations("Upload");

  const optionalSlots: {
    role: Exclude<ReferenceRole, "front">;
    image: UploadedImage | null;
  }[] = (
    [
      { role: "profile" as const, image: value.profile },
      { role: "expression" as const, image: value.expression },
    ] as const
  ).slice(0, Math.max(0, maxReferences - 1)) as {
    role: Exclude<ReferenceRole, "front">;
    image: UploadedImage | null;
  }[];

  function setRole(
    role: ReferenceRole,
    image: UploadedImage | null,
  ): void {
    if (role === "front") onChange({ ...value, front: image });
    else if (role === "profile") onChange({ ...value, profile: image });
    else onChange({ ...value, expression: image });
  }

  return (
    <section className="flex flex-col gap-3" aria-label={t("title")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Images className="h-4 w-4" aria-hidden />
          {t("title")}
        </div>
        <span className="text-xs text-muted-foreground">
          {multiEnabled
            ? t("limitEnabled", { max: maxReferences })
            : t("limitSingle")}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
        <li>{t("quality.faceVisible")}</li>
        <li>{t("quality.evenLight")}</li>
        <li>{t("quality.headshotCrop")}</li>
      </ul>

      <ImageUploader
        label={t("roles.front")}
        value={value.front}
        onChange={(image) => setRole("front", image)}
      />

      {multiEnabled ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {optionalSlots.map(({ role, image }) => (
            <ImageUploader
              key={role}
              label={t(`roles.${role}`)}
              value={image}
              onChange={(next) => setRole(role, next)}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground"
          role="note"
        >
          <div className="flex items-start gap-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              {t("unsupported", {
                provider: providerLabel,
              })}
            </p>
          </div>
          <ul className="list-inside list-disc space-y-0.5 pl-1">
            <li>{t("roles.profile")} — {t("roleHelp.profile")}</li>
            <li>{t("roles.expression")} — {t("roleHelp.expression")}</li>
          </ul>
          <p>{t("frontOnlyHelp")}</p>
          <p className="text-[11px] opacity-80">
            {tUpload("hint")}
          </p>
        </div>
      )}
    </section>
  );
}
