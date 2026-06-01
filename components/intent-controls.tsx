"use client";

import { useTranslations } from "next-intl";

import {
  AVATAR_BACKGROUNDS,
  AVATAR_COMPOSITIONS,
  AVATAR_GOALS,
  INTENT_LEVELS,
  type AvatarBackground,
  type AvatarComposition,
  type AvatarGoal,
  type IntentLevel,
} from "@/lib/avatar-intent";
import { isPhotoMode, type GenerationMode } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export type IntentControlValue = {
  goal: AvatarGoal;
  likeness: IntentLevel;
  creativity: IntentLevel;
  composition: AvatarComposition;
  background: AvatarBackground;
  palette: string;
  mood: string;
  accessories: string;
  avoid: string;
};

export function IntentControls({
  mode,
  value,
  onGoalChange,
  onChange,
}: {
  mode: GenerationMode;
  value: IntentControlValue;
  onGoalChange: (goal: AvatarGoal) => void;
  onChange: (patch: Partial<IntentControlValue>) => void;
}) {
  const t = useTranslations("Intent");
  const showLikeness = isPhotoMode(mode);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium">{t("label")}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-goal">{t("goalLabel")}</Label>
          <Select
            id="intent-goal"
            value={value.goal}
            onChange={(event) => onGoalChange(event.target.value as AvatarGoal)}
          >
            {AVATAR_GOALS.map((goal) => (
              <option key={goal} value={goal}>
                {t(`goals.${goal}`)}
              </option>
            ))}
          </Select>
        </div>

        {showLikeness && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="intent-likeness">{t("likenessLabel")}</Label>
            <Select
              id="intent-likeness"
              value={value.likeness}
              onChange={(event) =>
                onChange({ likeness: event.target.value as IntentLevel })
              }
            >
              {INTENT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {t(`levels.${level}`)}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-creativity">{t("creativityLabel")}</Label>
          <Select
            id="intent-creativity"
            value={value.creativity}
            onChange={(event) =>
              onChange({ creativity: event.target.value as IntentLevel })
            }
          >
            {INTENT_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`levels.${level}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-composition">{t("compositionLabel")}</Label>
          <Select
            id="intent-composition"
            value={value.composition}
            onChange={(event) =>
              onChange({
                composition: event.target.value as AvatarComposition,
              })
            }
          >
            {AVATAR_COMPOSITIONS.map((composition) => (
              <option key={composition} value={composition}>
                {t(`compositions.${composition}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-background">{t("backgroundLabel")}</Label>
          <Select
            id="intent-background"
            value={value.background}
            onChange={(event) =>
              onChange({ background: event.target.value as AvatarBackground })
            }
          >
            {AVATAR_BACKGROUNDS.map((background) => (
              <option key={background} value={background}>
                {t(`backgrounds.${background}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-palette">{t("paletteLabel")}</Label>
          <Input
            id="intent-palette"
            value={value.palette}
            placeholder={t("palettePlaceholder")}
            onChange={(event) => onChange({ palette: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-mood">{t("moodLabel")}</Label>
          <Input
            id="intent-mood"
            value={value.mood}
            placeholder={t("moodPlaceholder")}
            onChange={(event) => onChange({ mood: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-accessories">{t("accessoriesLabel")}</Label>
          <Input
            id="intent-accessories"
            value={value.accessories}
            placeholder={t("accessoriesPlaceholder")}
            onChange={(event) => onChange({ accessories: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="intent-avoid">{t("avoidLabel")}</Label>
          <Input
            id="intent-avoid"
            value={value.avoid}
            placeholder={t("avoidPlaceholder")}
            onChange={(event) => onChange({ avoid: event.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
