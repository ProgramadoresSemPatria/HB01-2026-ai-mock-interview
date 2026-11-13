/**
 * Module-level store for PWA install state, read through `usePwaInstall`.
 *
 * `beforeinstallprompt` can fire before React hydrates, so the root layout
 * also ships a tiny inline script (`PWA_INSTALL_CAPTURE_SCRIPT`) that stashes
 * the event on `window`; the store adopts it on first load and keeps
 * listening afterwards.
 */

export type PwaPlatform = "ios" | "android" | "desktop" | "other";

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

declare global {
  interface Window {
    __honeInstallPrompt?: BeforeInstallPromptEvent | null;
  }
  interface Navigator {
    /** iOS Safari: true when launched from the home screen. */
    standalone?: boolean;
  }
}

export interface PwaInstallSnapshot {
  /** A deferred `beforeinstallprompt` is available (Chromium on Android/desktop). */
  canPrompt: boolean;
  /** Running as an installed app (display-mode standalone & co, or iOS home screen). */
  isInstalled: boolean;
  platform: PwaPlatform;
  /** iOS Safari, where install is manual: Share → "Add to Home Screen". */
  isIOSSafari: boolean;
}

export const PWA_INSTALL_CAPTURE_SCRIPT = `window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__honeInstallPrompt=e;});`;

const SERVER_SNAPSHOT: PwaInstallSnapshot = {
  canPrompt: false,
  isInstalled: false,
  platform: "other",
  isIOSSafari: false,
};

const INSTALLED_DISPLAY_MODES = [
  "standalone",
  "fullscreen",
  "minimal-ui",
  "window-controls-overlay",
];

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedViaEvent = false;
let snapshot: PwaInstallSnapshot = SERVER_SNAPSHOT;
let platformInfo: Pick<PwaInstallSnapshot, "platform" | "isIOSSafari"> | null =
  null;
const listeners = new Set<() => void>();

function detectPlatform(): Pick<
  PwaInstallSnapshot,
  "platform" | "isIOSSafari"
> {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as "Macintosh"; touch support gives it away.
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isIOS) {
    const isIOSSafari =
      /Safari/.test(ua) &&
      !/CriOS|FxiOS|EdgiOS|OPiOS|GSA|FBAN|FBAV|Instagram|Line\//.test(ua);
    return { platform: "ios", isIOSSafari };
  }
  if (/Android/i.test(ua)) return { platform: "android", isIOSSafari: false };
  if (/Mobi|Tablet/i.test(ua)) return { platform: "other", isIOSSafari: false };
  return { platform: "desktop", isIOSSafari: false };
}

function detectInstalled(): boolean {
  if (installedViaEvent || navigator.standalone === true) return true;
  return INSTALLED_DISPLAY_MODES.some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  );
}

function computeSnapshot(): PwaInstallSnapshot {
  platformInfo ??= detectPlatform();
  const isInstalled = detectInstalled();
  return {
    canPrompt: deferredPrompt !== null && !isInstalled,
    isInstalled,
    ...platformInfo,
  };
}

function emit() {
  snapshot = computeSnapshot();
  listeners.forEach((listener) => listener());
}

let initialized = false;

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (window.__honeInstallPrompt) {
    deferredPrompt = window.__honeInstallPrompt;
    window.__honeInstallPrompt = null;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    window.__honeInstallPrompt = null;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    installedViaEvent = true;
    emit();
  });
  for (const mode of INSTALLED_DISPLAY_MODES) {
    window
      .matchMedia(`(display-mode: ${mode})`)
      .addEventListener("change", emit);
  }

  snapshot = computeSnapshot();
}

init();

export function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): PwaInstallSnapshot {
  return snapshot;
}

export function getServerSnapshot(): PwaInstallSnapshot {
  return SERVER_SNAPSHOT;
}

/**
 * Opens the native install dialog. A deferred prompt can be used only once,
 * so it is dropped afterwards whatever the outcome.
 */
export async function promptInstall(): Promise<InstallOutcome> {
  const event = deferredPrompt;
  if (!event) return "unavailable";
  deferredPrompt = null;
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    return outcome;
  } catch {
    return "unavailable";
  } finally {
    emit();
  }
}
