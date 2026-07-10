export function mapBrowserLocale(browserLang: string): "en" | "pt" {
  if (browserLang.startsWith("en")) return "en";
  if (browserLang.startsWith("pt")) return "pt";
  return "en";
}
