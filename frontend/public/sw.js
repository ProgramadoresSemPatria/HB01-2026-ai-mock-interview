/* Hone service worker — hand-written, no build step.
 *
 * Scope: the app's basePath ("/" locally, "/ai-mock-interview" on Labs). No
 * trailing slash: Next serves the basePath root as "/ai-mock-interview", which
 * a "/ai-mock-interview/" scope would leave uncontrolled.
 * labs.borderlesscoding.com is shared with other apps, so this worker only
 * ever touches same-origin requests inside its own scope and only deletes
 * caches carrying its own "hone-" prefix.
 *
 * Strategies:
 * - <base>/_next/static/*  cache-first (content-hashed, immutable), trimmed.
 * - <base>/icons/*         stale-while-revalidate.
 * - navigations            network-only; offline → precached offline.html.
 *                          Page HTML is never cached (pages are per-user).
 * - everything else        untouched: API/auth routes, RSC payloads,
 *                          SSE streams, cross-origin backend calls, non-GET.
 *
 * Bump CACHE_VERSION when the precache list or strategies change.
 */
const CACHE_VERSION = "v1";
const CACHE_PREFIX = "hone-";
const PRECACHE = `${CACHE_PREFIX}precache-${CACHE_VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const STATIC_MAX_ENTRIES = 250;

// "" locally, "/ai-mock-interview" on Labs.
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");

const OFFLINE_URL = `${BASE}/offline.html`;
const PRECACHE_URLS = [
  OFFLINE_URL,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) =>
        cache.addAll(
          PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const keep = new Set([PRECACHE, STATIC_CACHE]);
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && !keep.has(name))
          .map((name) => caches.delete(name)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

function isBypassed(request, url) {
  if (request.method !== "GET") return true;
  if (url.origin !== self.location.origin) return true; // backend, PostHog, fonts CDN…
  if (url.pathname !== BASE && !url.pathname.startsWith(`${BASE}/`)) {
    return true; // another Labs app on the same origin
  }
  const path = url.pathname.slice(BASE.length) || "/";
  if (path.startsWith("/api/")) return true; // better-auth + any route handler
  if (path === "/sw.js" || path === "/manifest.webmanifest") return true;
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/event-stream")) return true;
  if (request.headers.get("rsc") || url.searchParams.has("_rsc")) return true;
  if (request.headers.has("range")) return true;
  return false;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (isBypassed(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(event));
    return;
  }

  const path = url.pathname.slice(BASE.length);
  if (path.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (path.startsWith("/icons/")) {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});

async function handleNavigation(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    const offline = await caches.match(OFFLINE_URL, { cacheName: PRECACHE });
    return (
      offline ||
      new Response("Offline", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
    trimCache(cache, STATIC_MAX_ENTRIES);
  }
  return response;
}

async function staleWhileRevalidate(event, request) {
  const cache = await caches.open(PRECACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || Response.error());
  if (cached) {
    event.waitUntil(network);
    return cached;
  }
  return network;
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  // Cache.keys() returns insertion order, so the oldest go first.
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}
