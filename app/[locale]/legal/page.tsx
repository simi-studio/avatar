import { getTranslations, setRequestLocale } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Legal");

  const sections = [
    { title: t("disclaimerTitle"), body: t("disclaimerBody") },
    { title: t("termsTitle"), body: t("termsBody") },
    { title: t("privacyTitle"), body: t("privacyBody") },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
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
    </div>
  );
}
