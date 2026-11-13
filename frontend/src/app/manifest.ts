import type { MetadataRoute } from "next";

// Colors mirror the design tokens in src/index.css: the app is light-only
// (ThemeProvider forces "light") and every canvas paints
// --color-paper-white, while --color-jade (= --primary) is the brand disc.
const PAPER_WHITE = "#ffffff";

// Same build-time variable next.config.ts uses for `basePath`.
const BASE_PATH = process.env.NEXT_BASE_PATH ?? "";
// The app root is "/ai-mock-interview" (Next serves it without a trailing
// slash), so the scope must not end with "/" or the home page would fall
// outside it. Matches the service worker scope.
const APP_ROOT = BASE_PATH || "/";
// Installed app opens straight into the product; logged-out users are
// redirected to /login by the app as usual.
const START_URL = `${BASE_PATH}/dashboard`;

/**
 * Served at `<basePath>/manifest.webmanifest`. Icon paths are relative, so
 * they resolve against the manifest URL itself (and thus the basePath).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: APP_ROOT,
    name: "Hone — AI Mock Interview",
    short_name: "Hone",
    description:
      "AI Mock Interview, technical interview preparation, structured feedback, guided practice with AI.",
    start_url: START_URL,
    scope: APP_ROOT,
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: PAPER_WHITE,
    theme_color: PAPER_WHITE,
    lang: "pt-BR",
    categories: ["education", "productivity"],
    icons: [
      {
        src: "icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
