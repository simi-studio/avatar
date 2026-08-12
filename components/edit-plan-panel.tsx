"use client";

import { useTranslations } from "next-intl";
import { ListChecks } from "lucide-react";

import {
  CONSTRAINED_EDIT_ACTIONS,
  editItemsToText,
  isEditPlanReady,
  type ConstrainedEditAction,
  type EditIntent,
  updateEditPlanField,
} from "@/lib/edit-intent";
import type { EditStrategy } from "@/lib/provider-capabilities";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Editable pre-call review of `change[]` / `preserve[]` (Epic 11.3).
 * Does not perform the paid call — the parent confirms after the user edits.
 */
export function EditPlanPanel({
  plan,
  strategy,
  disabled = false,
  confirmDisabled = false,
  stale = false,
  onPlanChange,
  onConfirm,
  onCancel,
  onConstrainedAction,
}: {
  plan: EditIntent;
  strategy: EditStrategy;
  disabled?: boolean;
  confirmDisabled?: boolean;
  stale?: boolean;
  onPlanChange: (plan: EditIntent) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onConstrainedAction?: (action: ConstrainedEditAction) => void;
}) {
  const t = useTranslations("EditPlan");
  const tc = useTranslations("Common");
  const ready = isEditPlanReady(plan);
  const applyLabel =
    strategy === "regenerate" ? t("applyRegenerate") : t("applyEdit");

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
      aria-label={t("title")}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <ListChecks className="h-4 w-4" aria-hidden />
          {t("title")}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      {stale && (
        <p role="alert" className="text-xs text-amber-800 dark:text-amber-300">
          {t("stale")}
        </p>
      )}

      {onConstrainedAction && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            {t("constrainedLabel")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CONSTRAINED_EDIT_ACTIONS.map((action) => (
              <Button
                key={action}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onConstrainedAction(action)}
              >
                {t(`actions.${action}`)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-plan-change">{t("changeLabel")}</Label>
          <Textarea
            id="edit-plan-change"
            rows={4}
            value={editItemsToText(plan.change)}
            disabled={disabled}
            placeholder={t("changePlaceholder")}
            onChange={(event) =>
              onPlanChange(updateEditPlanField(plan, "change", event.target.value))
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-plan-preserve">{t("preserveLabel")}</Label>
          <Textarea
            id="edit-plan-preserve"
            rows={4}
            value={editItemsToText(plan.preserve)}
            disabled={disabled}
            placeholder={t("preservePlaceholder")}
            onChange={(event) =>
              onPlanChange(
                updateEditPlanField(plan, "preserve", event.target.value),
              )
            }
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t("costNote")}</p>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={disabled || confirmDisabled || !ready || stale}
          onClick={onConfirm}
        >
          {applyLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onCancel}
        >
          {tc("cancel")}
        </Button>
      </div>
    </section>
  );
}
