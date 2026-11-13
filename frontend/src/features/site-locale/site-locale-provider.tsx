"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { en, type SiteMessages } from "./messages/en";
import { pt } from "./messages/pt";
import {
  DEFAULT_SITE_LOCALE,
  HTML_LANG,
  SITE_LOCALE_COOKIE,
  parseSiteLocale,
  type SiteLocale,
} from "./site-locale";

const MESSAGES: Record<SiteLocale, SiteMessages> = { en, pt };
const ONE_YEAR_S = 60 * 60 * 24 * 365;
// Scope the cookie to Hone's basePath on the shared Labs origin.
const COOKIE_PATH = process.env.__NEXT_ROUTER_BASEPATH || "/";

type SiteLocaleContextValue = {
  locale: SiteLocale;
  t: SiteMessages;
  setLocale: (locale: SiteLocale) => void;
};

// Without a provider (logged-in app, login) shared components stay in English.
const SiteLocaleContext = createContext<SiteLocaleContextValue>({
  locale: DEFAULT_SITE_LOCALE,
  t: en,
  setLocale: () => {},
});

// --- cookie-backed store -----------------------------------------------------

const listeners = new Set<() => void>();

function readCookieLocale(): SiteLocale {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${SITE_LOCALE_COOKIE}=`));
  return parseSiteLocale(match?.split("=")[1]);
}

function writeCookieLocale(locale: SiteLocale) {
  document.cookie = `${SITE_LOCALE_COOKIE}=${locale}; path=${COOKIE_PATH}; max-age=${ONE_YEAR_S}; samesite=lax`;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Public-site (landing / download) UI language. Independent of the user's
 * interview language (features/interview-locale).
 *
 * `initialLocale` comes from the cookie read on the server, so PT visitors get
 * Portuguese HTML with no flash; after hydration the cookie is the source of
 * truth (covers pages restored from the client router cache).
 */
export function SiteLocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: SiteLocale;
  children: React.ReactNode;
}) {
  const locale = useSyncExternalStore(
    subscribe,
    readCookieLocale,
    () => initialLocale,
  );

  const setLocale = useCallback((next: SiteLocale) => {
    writeCookieLocale(next);
  }, []);

  // <html lang> is rendered by the root layout (shared with the app), so the
  // public pages patch it on the client and restore it when they unmount.
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.lang;
    html.lang = HTML_LANG[locale];
    return () => {
      html.lang = previous;
    };
  }, [locale]);

  const value = useMemo(
    () => ({ locale, t: MESSAGES[locale], setLocale }),
    [locale, setLocale],
  );

  return (
    <SiteLocaleContext.Provider value={value}>
      {children}
    </SiteLocaleContext.Provider>
  );
}

export function useSiteLocale(): SiteLocaleContextValue {
  return useContext(SiteLocaleContext);
}
