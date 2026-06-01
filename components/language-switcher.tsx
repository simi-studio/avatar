"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Select } from "@/components/ui/select";

const LOCALE_STORAGE_KEY = "simi-avatar-locale";

/** Language switcher that persists the choice in localStorage. */
export function LanguageSwitcher() {
  const t = useTranslations("Language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // Ignore storage errors (e.g. private mode); navigation still works.
    }
    router.replace(pathname, { locale: next });
  }

  return (
    <Select
      aria-label={t("label")}
      value={locale}
      onChange={onChange}
      className="h-9 w-auto"
    >
      {routing.locales.map((code) => (
        <option key={code} value={code}>
          {t(code)}
        </option>
      ))}
    </Select>
  );
}

export { LOCALE_STORAGE_KEY };
