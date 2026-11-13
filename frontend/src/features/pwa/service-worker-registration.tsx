"use client";

import { useEffect } from "react";

// Inlined by Next at build time ("" locally, "/ai-mock-interview" on Labs).
const BASE_PATH = process.env.__NEXT_ROUTER_BASEPATH ?? "";
const SW_URL = `${BASE_PATH}/sw.js`;
// No trailing slash: Next serves the basePath root as "/ai-mock-interview",
// which a "/ai-mock-interview/" scope would not control. Allowed by the
// Service-Worker-Allowed header set in next.config.ts.
const SW_SCOPE = BASE_PATH || "/";

/**
 * Registers `public/sw.js` in production builds only. In development it
 * removes a worker left behind by a local `next start`, so cached chunks
 * never shadow HMR. Only registrations for this app's own scope are touched
 * (the Labs origin hosts other apps).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      const scopeUrl = new URL(SW_SCOPE, window.location.origin).href;
      void navigator.serviceWorker
        .getRegistration(SW_SCOPE)
        .then((registration) => {
          if (registration?.scope === scopeUrl) void registration.unregister();
        });
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" })
        .catch((error: unknown) => {
          console.warn("[pwa] service worker registration failed", error);
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
