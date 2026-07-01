"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, TriangleAlert } from "lucide-react";

import type { AvatarPlan } from "@/lib/avatar-plan";

/**
 * Read-only preview of the derived avatar plan (Epic 10.3). It renders only
 * settings the user already controls; it never receives a key, image, or
 * provider response.
 */
export function AvatarPlanPanel({ plan }: { plan: AvatarPlan }) {
  const tPlan = useTranslations("Plan");
  const tIntent = useTranslations("Intent");
  const tStyle = useTranslations("Style");
  const tTheme = useTranslations("Theme");

  const subject =
    plan.mode === "themed"
      ? [plan.themeId ? tTheme(plan.themeId) : undefined, plan.variantId ? tTheme(plan.variantId) : undefined]
          .filter(Boolean)
          .join(" · ")
      : plan.styleId
        ? tStyle(plan.styleId)
        : undefined;

  const rows: { label: string; value: string }[] = [
    { label: tPlan("goal"), value: tIntent(`goals.${plan.goal}`) },
    ...(subject
      ? [{ label: plan.mode === "themed" ? tPlan("theme") : tPlan("style"), value: subject }]
      : []),
    { label: tPlan("composition"), value: tIntent(`compositions.${plan.composition}`) },
    { label: tPlan("background"), value: tIntent(`backgrounds.${plan.background}`) },
    { label: tPlan("likeness"), value: tIntent(`levels.${plan.likeness}`) },
    { label: tPlan("creativity"), value: tIntent(`levels.${plan.creativity}`) },
    { label: tPlan("calls"), value: String(plan.generationCount) },
  ];

  return (
    <section
      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4"
      aria-label={tPlan("title")}
    >
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <ClipboardList className="h-4 w-4" aria-hidden />
        {tPlan("title")}
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      {plan.risks.length > 0 && (
        <ul className="flex flex-col gap-1">
          {plan.risks.map((risk) => (
            <li
              key={risk}
              className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400"
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{tPlan(`risk.${risk}`)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
