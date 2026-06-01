import { getTranslations } from "next-intl/server";
import { Github, Sparkles } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { GITHUB_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const t = await getTranslations();

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <span>{t("Common.appName")}</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/generate">{t("Nav.generate")}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/about">{t("Nav.about")}</Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" aria-hidden />
              <span className="sr-only sm:not-sr-only">GitHub</span>
            </a>
          </Button>
          <ThemeToggle />
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
