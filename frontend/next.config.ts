import "@/config/env";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const basePath = process.env.NEXT_BASE_PATH;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  typedRoutes: true,
  reactCompiler: true,
  // PWA files must always be revalidated so a deploy reaches installed apps.
  // `source` is basePath-relative. On Cloudflare these headers are also
  // applied to responses served from the ASSETS binding (OpenNext routing),
  // which public/_headers cannot cover: OpenNext copies public/ under the
  // basePath, while Workers only reads _headers from the assets root.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          // The SW scope is the basePath without a trailing slash (so it
          // also controls "/ai-mock-interview" itself), which sits above the
          // script's directory and therefore needs this header.
          { key: "Service-Worker-Allowed", value: basePath || "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/offline.html",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
