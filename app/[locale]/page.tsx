import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Boxes,
  Download,
  Github,
  ImageIcon,
  KeyRound,
  Lock,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { GITHUB_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tc = await getTranslations("Common");

  const highlights = [
    { icon: KeyRound, title: t("byokTitle"), body: t("byokBody") },
    { icon: Lock, title: t("privacyTitle"), body: t("privacyBody") },
    { icon: Github, title: t("openSourceTitle"), body: t("openSourceBody") },
    { icon: Boxes, title: t("extensibleTitle"), body: t("extensibleBody") },
  ];
  const previewChips = [
    t("heroPreviewChipStyle"),
    t("heroPreviewChipBackground"),
    t("heroPreviewChipSize"),
  ];

  return (
    <div className="flex flex-col gap-12">
      <section className="grid items-center gap-10 py-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)] lg:py-10">
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1 text-sm text-muted-foreground shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            BYOK · Open Source
          </span>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <p className="max-w-xl text-sm text-muted-foreground">
              {t("heroSupport")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="sm:min-w-36">
              <Link href="/generate">
                <Wand2 className="h-4 w-4" aria-hidden />
                {tc("launchApp")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="sm:min-w-40">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" aria-hidden />
                {tc("viewOnGitHub")}
              </a>
            </Button>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl" />
          <div className="relative overflow-hidden rounded-lg border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wand2 className="h-4 w-4 text-primary" aria-hidden />
                {t("heroPreviewTitle")}
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {t("heroPreviewBadge")}
              </span>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <div className="rounded-md border bg-background p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("heroPreviewPromptLabel")}
                  </p>
                  <p className="mt-2 text-sm">
                    {t("heroPreviewPrompt")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {previewChips.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                  <KeyRound className="mb-2 h-4 w-4 text-primary" aria-hidden />
                  {t("heroPreviewPrivacy")}
                </div>
              </div>
              <div className="hidden min-h-72 place-items-center rounded-md border border-dashed bg-muted/30 p-5 text-center sm:grid">
                <div className="space-y-4">
                  <div className="mx-auto grid h-28 w-28 place-items-center rounded-2xl border bg-background shadow-sm">
                    <ImageIcon className="h-10 w-10 text-primary" aria-hidden />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium">{t("heroPreviewResult")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("heroPreviewResultBody")}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" aria-hidden />
                    {t("heroPreviewDownload")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6 pb-10">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("highlightsTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title, body }) => (
            <Card key={title}>
              <CardHeader>
                <Icon className="h-6 w-6 text-primary" aria-hidden />
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {body}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
