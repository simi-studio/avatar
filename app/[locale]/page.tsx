import { getTranslations, setRequestLocale } from "next-intl/server";
import { Github, KeyRound, Lock, Boxes, Sparkles } from "lucide-react";

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

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          BYOK · Open Source
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          {t("heroSubtitle")}
        </p>
        <p className="text-sm text-muted-foreground">{t("heroSupport")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/generate">{tc("launchApp")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" aria-hidden />
              {tc("viewOnGitHub")}
            </a>
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
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
