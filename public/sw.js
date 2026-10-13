/* Muhasabah service worker
 *
 * - Navigations: network-first (deploys are never served stale), cached copy
 *   as the offline fallback.
 * - /_next/static, images and fonts: stale-while-revalidate (fast, then fresh).
 * - /api/quran/surah|juz/*: cache-first with a background revalidate, so a
 *   saved surah can be read with the network off (see `quranApi`).
 * - Old versioned caches are dropped on activate; the Quran cache is trimmed
 *   to QURAN_CACHE_MAX entries there too.
 */

const VERSION = "v1";
const PAGE_CACHE = `muhasabah-pages-${VERSION}`;
const ASSET_CACHE = `muhasabah-assets-${VERSION}`;
const RUNTIME_CACHE = `muhasabah-runtime-${VERSION}`;
const QURAN_CACHE = `muhasabah-quran-${VERSION}`;
const CURRENT_CACHES = [PAGE_CACHE, ASSET_CACHE, RUNTIME_CACHE, QURAN_CACHE];
const CACHE_PREFIX = "muhasabah-";

/** Only the Quran reader's API GETs are cached for offline reading. */
const QURAN_API_PATTERN = /^\/api\/quran\/(?:surah|juz)\/\d+$/;
/** Bounded so "save the whole Quran" can never grow the cache without limit. */
const QURAN_CACHE_MAX = 200;
/** The API serves this reciter when `?reciter=` is absent — same bytes either way. */
const DEFAULT_RECITER = "ar.alafasy";

/** Only handle requests we can meaningfully cache. */
const KNOWN_HOSTS = [
  self.location.origin,
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(PAGE_CACHE);
        await cache.addAll(["/", "/manifest.webmanifest"]);
      } catch {
        /* precache is best effort — never block install */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name)),
      );
      await trimCache(QURAN_CACHE, QURAN_CACHE_MAX);
      await self.clients.claim();
    })(),
  );
});

/** Keep at most `max` entries, dropping the oldest first (`keys()` is oldest-first). */
async function trimCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((request) => cache.delete(request)));
}

self.addEventListener("message", (event) => {
  const data = event.data;
  if (data && data.type === "SKIP_WAITING") self.skipWaiting();

  // A page can ask the worker to pin its own HTML so the route stays reachable
  // offline even when it was reached through a client-side (RSC) navigation.
  if (data && data.type === "PRECACHE_PAGE" && typeof data.url === "string") {
    const url = data.url;
    const done = (async () => {
      if (!url.startsWith("/")) return;
      const cache = await caches.open(PAGE_CACHE);
      if (await cache.match(url)) return;
      const response = await fetch(url, { credentials: "same-origin" });
      if (canCache(response)) await cache.put(url, response.clone());
    })().catch(() => {});
    if (typeof event.waitUntil === "function") event.waitUntil(done);
  }
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    /\.(?:png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|eot|mp3|mp4|webm|json|txt|xml)$/.test(
      url.pathname,
    )
  );
}

function canCache(response) {
  if (!response) return false;
  if (response.status === 206) return false;
  // Opaque = cross-origin no-cors (Google Fonts stylesheet) — cacheable, just
  // not inspectable.
  if (response.type === "opaque") return true;
  return response.ok && (response.type === "basic" || response.type === "cors");
}

/**
 * Stale-while-revalidate. The background refresh promise is handed to
 * `waitUntil` synchronously (during fetch dispatch) so the browser keeps the
 * worker alive for it.
 */
function staleWhileRevalidate(request, cacheName, event) {
  const refresh = caches
    .open(cacheName)
    .then((cache) =>
      fetch(request).then((response) => {
        if (canCache(response)) cache.put(request, response.clone());
        return response;
      }),
    )
    .catch(() => undefined);

  event.waitUntil(refresh);

  return caches
    .open(cacheName)
    .then((cache) => cache.match(request))
    .then((cached) => cached || refresh.then((response) => response || Response.error()));
}

/** Network-first: fresh content wins, cache is the offline fallback. */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    // Awaited so the HTML is guaranteed to be on disk before we hand it over —
    // this is what makes a visited dashboard route reachable offline.
    if (canCache(response)) {
      try {
        await cache.put(request, response.clone());
      } catch {
        /* a failed cache write must never break the response */
      }
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await caches.match("/");
    if (shell && request.mode === "navigate") return shell;
    return Response.error();
  }
}

/* ── Quran API (offline reading) ─────────────────────────────────────── */

function isQuranApi(url) {
  return url.origin === self.location.origin && QURAN_API_PATTERN.test(url.pathname);
}

/**
 * Stable cache key for a Quran API GET.
 *
 * `v=` is only a reader cache-buster and `?reciter=ar.alafasy` is exactly what
 * the route serves when the parameter is missing, so both are stripped: the
 * offline page (no query), the reader (`?reciter=ar.alafasy&v=4`) and any
 * reordered/extra `v` all share one entry. A *non*-default reciter keeps its
 * own key, because the per-ayah audio URLs differ between reciters.
 */
function quranCacheKey(url) {
  const key = new URL(url.toString());
  const reciter = key.searchParams.get("reciter");
  const rest = [];
  key.searchParams.forEach((value, name) => {
    if (name === "v") return;
    if (name === "reciter" && (!reciter || reciter === DEFAULT_RECITER)) return;
    rest.push([name, value]);
  });
  rest.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  key.search = "";
  key.hash = "";
  for (const entry of rest) key.searchParams.append(entry[0], entry[1]);
  return key.toString();
}

/** Response headers are immutable, so mark hit/miss through a fresh Response. */
function withHeader(response, name, value) {
  const headers = new Headers(response.headers);
  // The body we hand back is already content-decoded — the original framing
  // headers must not survive, or the consumer would try to decode it twice.
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.set(name, value);
  const body = [101, 204, 205, 304].includes(response.status) ? null : response.body;
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

/** Explicit offline answer so the UI can say "অফলাইনে নেই" instead of hanging. */
function quranOfflineResponse() {
  return new Response(JSON.stringify({ offline: true, error: "অফলাইনে নেই" }), {
    status: 504,
    statusText: "Gateway Timeout",
    headers: { "content-type": "application/json; charset=utf-8", "X-SW-Cache": "offline" },
  });
}

/**
 * Stale-while-revalidate for the Quran API: the cached surah is returned
 * immediately (so it also works with the network off) while the same request
 * refreshes the entry in the background. Nothing cached + no network ⇒ 504.
 *
 * `event.waitUntil(refresh)` runs synchronously — waitUntil may only be called
 * while the fetch event is still dispatching, so it must not sit behind an
 * `await`.
 */
function quranApi(request, event) {
  const key = quranCacheKey(new URL(request.url));
  const refresh = caches
    .open(QURAN_CACHE)
    .then((cache) =>
      fetch(request).then(async (response) => {
        if (!canCache(response)) return withHeader(response, "X-SW-Cache", "error");
        await cache.put(key, response.clone());
        return withHeader(response, "X-SW-Cache", "miss");
      }),
    )
    .catch(() => undefined);

  event.waitUntil(refresh);

  return caches
    .open(QURAN_CACHE)
    // `ignoreVary`: the API answers with Next's `Vary: rsc, ...` list, and the
    // cache key is already fully normalized — Vary must not add noise on top.
    .then((cache) => cache.match(key, { ignoreVary: true }))
    .then((cached) => {
      if (cached) return withHeader(cached, "X-SW-Cache", "hit");
      // Cold miss: wait for the network; if it is down, hand back the 504.
      return refresh.then((response) => response || quranOfflineResponse());
    });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (!KNOWN_HOSTS.includes(url.origin)) return;

  // Pages: network-first so updates are never stale.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  // Quran API: cache-first + background revalidate (offline reading).
  if (isQuranApi(url)) {
    event.respondWith(quranApi(request, event));
    return;
  }

  // Hashed build assets + media: cache-first (they are immutable).
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE, event));
    return;
  }

  // Fonts / other cross-origin GETs.
  if (url.origin !== self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, event));
    return;
  }

  // Anything else same-origin (API, RSC payloads): network-first + fallback.
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});
