"use client";

import { Share, SquarePlus, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Surface } from "@/components/ui/surface";
import { ComingSoonBadge } from "@/components/coming-soon-badge";
import { ComingSoonDialog } from "@/components/coming-soon-dialog";
import {
  SiteLocaleProvider,
  useSiteLocale,
} from "@/features/site-locale/site-locale-provider";

import { usePwaInstall } from "./use-pwa-install";

const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";
// Prefixed: localStorage is shared with every app on the Labs origin.
const DISMISSED_KEY = "hone-pwa-install-dismissed-at";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 3000;
// Only on "home" screens: never over an interview/study session, and not on
// /download, which renders its own install UI.
const ALLOWED_PATHS = new Set(["/", "/dashboard"]);
// Public pages whose UI follows the site-locale cookie (EN/PT).
const PUBLIC_PATHS = new Set(["/"]);

function wasDismissedRecently() {
  try {
    const value = Number(window.localStorage.getItem(DISMISSED_KEY));
    return Number.isFinite(value) && Date.now() - value < DISMISS_FOR_MS;
  } catch {
    return false;
  }
}

function rememberDismissal() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // Storage blocked (private mode): the banner just comes back next visit.
  }
}

/**
 * Small dismissible install banner: an install button on Chromium
 * (Android/desktop), an "Add to Home Screen" hint on iOS Safari.
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const { canPrompt, isInstalled, isIOSSafari } = usePwaInstall();
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!wasDismissedRecently()) setReady(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const eligible = canPrompt || isIOSSafari;
  if (!ready || closed || isInstalled || !eligible) return null;
  if (!ALLOWED_PATHS.has(pathname)) return null;

  const dismiss = () => {
    rememberDismissal();
    setClosed(true);
  };

  const banner = (
    <InstallBanner canPrompt={canPrompt} onDismiss={dismiss} />
  );

  // The banner mounts after hydration, so the provider reads the cookie
  // directly; the logged-in app keeps the English default.
  return PUBLIC_PATHS.has(pathname) ? (
    <SiteLocaleProvider initialLocale="en">{banner}</SiteLocaleProvider>
  ) : (
    banner
  );
}

function InstallBanner({
  canPrompt,
  onDismiss,
}: {
  canPrompt: boolean;
  onDismiss: () => void;
}) {
  const { t } = useSiteLocale();
  const copy = t.installBanner;
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  return (
    <div
      role="region"
      aria-label={copy.title}
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[22rem]"
    >
      <Surface
        variant="elevated"
        padding="sm"
        radius="md"
        className="flex items-start gap-3"
      >
        <Image
          src={`${BASE_PATH}/icons/icon-192.png`}
          alt=""
          width={44}
          height={44}
          unoptimized
          className="size-11 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-text-strong">
            {copy.title}
            <ComingSoonBadge />
          </p>
          {canPrompt ? (
            <>
              <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                {copy.body}
              </p>
              {/* The app is still in development: show the coming-soon dialog
                  instead of the native prompt (usePwaInstall().promptInstall
                  stays available to re-enable this at launch). */}
              <Button
                size="sm"
                className="mt-3"
                aria-haspopup="dialog"
                onClick={() => setComingSoonOpen(true)}
              >
                {copy.installApp}
              </Button>
              <ComingSoonDialog
                open={comingSoonOpen}
                onOpenChange={setComingSoonOpen}
              />
            </>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
              {copy.iosTap}{" "}
              <Share
                aria-label={copy.iosShare}
                className="inline size-3.5 -translate-y-px text-text-strong"
              />{" "}
              {copy.iosThen}{" "}
              <span className="whitespace-nowrap font-medium text-text-strong">
                {copy.iosAddToHomeScreen}{" "}
                <SquarePlus
                  aria-hidden="true"
                  className="inline size-3.5 -translate-y-px"
                />
              </span>
              .
            </p>
          )}
        </div>
        <IconButton
          variant="ghost"
          size="icon-sm"
          aria-label={copy.dismiss}
          className="-mr-1 -mt-1"
          onClick={onDismiss}
        >
          <X />
        </IconButton>
      </Surface>
    </div>
  );
}
