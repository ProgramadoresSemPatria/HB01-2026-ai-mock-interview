"use client";

import { Share, SquarePlus, X } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Surface } from "@/components/ui/surface";

import { usePwaInstall } from "./use-pwa-install";

const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";
// Prefixed: localStorage is shared with every app on the Labs origin.
const DISMISSED_KEY = "hone-pwa-install-dismissed-at";
const DISMISS_FOR_MS = 30 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 3000;
// Only on "home" screens: never over an interview/study session, and not on
// /download, which renders its own install UI.
const ALLOWED_PATHS = new Set(["/", "/dashboard"]);

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
 * Small dismissible install banner: the native prompt on Chromium
 * (Android/desktop), an "Add to Home Screen" hint on iOS Safari.
 */
export function InstallPrompt() {
  const pathname = usePathname();
  const { canPrompt, isInstalled, isIOSSafari, promptInstall } =
    usePwaInstall();
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

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome === "dismissed") rememberDismissal();
    setClosed(true);
  };

  return (
    <div
      role="region"
      aria-label="Install Hone"
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
          <p className="text-sm font-semibold text-text-strong">Install Hone</p>
          {canPrompt ? (
            <>
              <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                Open your practice sessions in one tap, full screen.
              </p>
              <Button size="sm" className="mt-3" onClick={install}>
                Install app
              </Button>
            </>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
              Tap{" "}
              <Share
                aria-label="Share"
                className="inline size-3.5 -translate-y-px text-text-strong"
              />{" "}
              in Safari, then{" "}
              <span className="whitespace-nowrap font-medium text-text-strong">
                Add to Home Screen{" "}
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
          aria-label="Dismiss install prompt"
          className="-mr-1 -mt-1"
          onClick={dismiss}
        >
          <X />
        </IconButton>
      </Surface>
    </div>
  );
}
