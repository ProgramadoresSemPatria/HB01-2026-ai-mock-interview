"use client";

import { useSiteLocale } from "./site-locale-provider";
import { SITE_LOCALES, type SiteLocale } from "./site-locale";

const LABELS: Record<SiteLocale, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  pt: { short: "PT", full: "Português (Brasil)" },
};

/** Compact segmented "EN | PT" pill for the public navbar. */
export function SiteLocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useSiteLocale();

  return (
    <div
      role="group"
      aria-label={t.common.language}
      className={`manrope inline-flex shrink-0 items-center rounded-full border border-border-hairline bg-paper-white/70 p-0.5 ${className ?? ""}`}
    >
      {SITE_LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option === "pt" ? "pt-BR" : "en"}
            aria-pressed={active}
            aria-label={LABELS[option].full}
            onClick={() => setLocale(option)}
            className={`inline-flex h-8 min-w-10 cursor-pointer items-center justify-center rounded-full px-2.5 text-[13px] font-medium tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jade focus-visible:ring-offset-1 ${
              active
                ? "bg-jade-mist text-jade-deep"
                : "text-slate-gray hover:text-ink-black"
            }`}
          >
            {LABELS[option].short}
          </button>
        );
      })}
    </div>
  );
}
