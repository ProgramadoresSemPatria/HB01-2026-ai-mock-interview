export type SiteLocale = "en" | "pt";

export const SITE_LOCALES: readonly SiteLocale[] = ["en", "pt"];
export const DEFAULT_SITE_LOCALE: SiteLocale = "en";

/** Prefixed: cookies are shared with every app on the Labs origin. */
export const SITE_LOCALE_COOKIE = "hone-site-locale";

/** Value for `<html lang>` per site locale. */
export const HTML_LANG: Record<SiteLocale, string> = {
  en: "en",
  pt: "pt-BR",
};

export function parseSiteLocale(value: string | null | undefined): SiteLocale {
  return value === "pt" || value === "en" ? value : DEFAULT_SITE_LOCALE;
}
