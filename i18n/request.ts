import { getRequestConfig } from "next-intl/server";
import { isSupportedLocale, routing } from "./routing";

/**
 * Loads the message catalog for the active locale. Falls back to the default
 * locale (English) when the requested locale is not supported.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isSupportedLocale(requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`./${locale}.json`)).default;

  return { locale, messages };
});
