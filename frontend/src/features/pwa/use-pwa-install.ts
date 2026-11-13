"use client";

import { useSyncExternalStore } from "react";

import {
  getServerSnapshot,
  getSnapshot,
  promptInstall,
  subscribe,
  type InstallOutcome,
  type PwaInstallSnapshot,
  type PwaPlatform,
} from "./pwa-install-store";

export type { InstallOutcome, PwaInstallSnapshot, PwaPlatform };

export interface UsePwaInstallResult extends PwaInstallSnapshot {
  /**
   * Shows the browser's install dialog when `canPrompt` is true.
   * Resolves "unavailable" otherwise (iOS, Firefox, already installed…).
   */
  promptInstall: () => Promise<InstallOutcome>;
}

/**
 * PWA install state for any client component.
 *
 * During SSR and the hydration pass it reports the neutral defaults
 * (`canPrompt: false`, `isInstalled: false`, `platform: "other"`,
 * `isIOSSafari: false`) and then updates with the real values.
 */
export function usePwaInstall(): UsePwaInstallResult {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return { ...snapshot, promptInstall };
}
