import { getTranslations, setRequestLocale } from "next-intl/server";

import { GITHUB_URL } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("About");

  const sections = [
    { title: t("modelsTitle"), body: t("modelsBody") },
    { title: t("securityTitle"), body: t("securityBody") },
    { title: t("deployTitle"), body: t("deployBody") },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {section.body}
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="text-sm text-muted-foreground">
        {t("license")} ·{" "}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          {GITHUB_URL}
        </a>
      </footer>
    </div>
  );
}
