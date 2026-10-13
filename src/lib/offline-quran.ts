/**
 * Offline Quran helpers: everything the "কুরআন অফলাইনে সেভ করুন" page needs to
 * save surahs into the service worker's cache, remember what it saved, and read
 * it back with the network off.
 *
 * ⚠️ `public/sw.js` normalises the reader's `?reciter=…&v=…` query down to the
 * bare path (its `quranCacheKey()`), which is exactly the key built by
 * `surahCacheKey()` below — so a surah saved here and one opened in the main
 * reader share a single cache entry. The cache-name constants must match the
 * worker's too. Change one ⇒ change both.
 */

export const TOTAL_SURAHS = 114;

/** localStorage manifest of surah numbers that are verified present in cache. */
const MANIFEST_KEY = "muhasabah.offline-surahs.v1";
/** Must match `QURAN_CACHE` in `public/sw.js`. */
const QURAN_CACHE_PREFIX = "muhasabah-quran-";
const PAGE_CACHE_PREFIX = "muhasabah-pages-";
const APP_CACHE_PREFIX = "muhasabah-";
/** Must match `VERSION` in `public/sw.js` — only used when no worker cache exists yet. */
const SW_VERSION_FALLBACK = "v1";

const QURAN_API_PATTERN = /^\/api\/quran\/(?:surah|juz)\/\d+$/;

export type OfflineAyah = {
  number: number;
  numberInSurah: number;
  page: number;
  surahNumber: number;
  surahName: string;
  arabic: string;
  bangla: string;
  audio: string;
};

type SurahPayload = { reciter?: string; ayahs?: OfflineAyah[]; offline?: boolean; error?: string };

/** Why a read could not produce ayahs — the UI translates these. */
export type OfflineQuranErrorCode = "offline-miss" | "network" | "server" | "invalid";

export class OfflineQuranError extends Error {
  readonly code: OfflineQuranErrorCode;
  constructor(code: OfflineQuranErrorCode, message: string) {
    super(message);
    this.name = "OfflineQuranError";
    this.code = code;
  }
}

/** 114 → "১১৪" */
export function toBn(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

export function isQuranApiUrl(url: string): boolean {
  try {
    return QURAN_API_PATTERN.test(new URL(url, "http://localhost").pathname);
  } catch {
    return false;
  }
}

/** Request path used by the reader and by this page (no query by design). */
export function surahPath(surah: number): string {
  return `/api/quran/surah/${surah}`;
}

/** Absolute URL — the exact key the service worker stores the response under. */
export function surahCacheKey(surah: number): string {
  const origin = typeof location !== "undefined" ? location.origin : "";
  return `${origin}${surahPath(surah)}`;
}

/* ── manifest (localStorage) ─────────────────────────────────────────── */

export function readManifest(): number[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(MANIFEST_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((value): value is number => Number.isInteger(value) && value >= 1 && value <= TOTAL_SURAHS)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function writeManifest(surahs: Iterable<number>): number[] {
  const unique = Array.from(new Set(surahs))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= TOTAL_SURAHS)
    .sort((a, b) => a - b);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(MANIFEST_KEY, JSON.stringify(unique));
    } catch {
      /* storage full / private mode — the cache itself still works */
    }
  }
  return unique;
}

/** Drops manifest entries whose cache copy disappeared (quota eviction, clear). */
export async function reconcileManifest(): Promise<number[]> {
  const stored = readManifest();
  const verified: number[] = [];
  for (const surah of stored) {
    if (await isSurahCached(surah)) verified.push(surah);
  }
  if (verified.length !== stored.length) writeManifest(verified);
  return verified;
}

/* ── cache inspection / writing ──────────────────────────────────────── */

export async function isSurahCached(surah: number): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  try {
    return Boolean(await caches.match(surahCacheKey(surah), { ignoreVary: true }));
  } catch {
    return false;
  }
}

/**
 * Name of the worker's Quran cache — discovered at runtime so this module never
 * hardcodes the worker's VERSION when it can avoid it. Used for the "no worker
 * is controlling this page yet" path, where we store the response ourselves
 * (Cache Storage is shared, so the worker picks the entry up later).
 */
async function quranCacheName(): Promise<string | null> {
  const names = await caches.keys();
  const existing = names.find((name) => name.startsWith(QURAN_CACHE_PREFIX));
  if (existing) return existing;
  const pages = names.find((name) => name.startsWith(PAGE_CACHE_PREFIX));
  if (pages) return `${QURAN_CACHE_PREFIX}${pages.slice(PAGE_CACHE_PREFIX.length)}`;
  // Nothing has ever been cached (e.g. `next dev` without NEXT_PUBLIC_ENABLE_SW=1):
  // create the exact name the worker uses so the entry is not orphaned.
  return `${QURAN_CACHE_PREFIX}${SW_VERSION_FALLBACK}`;
}

/* ── downloading ─────────────────────────────────────────────────────── */

async function storeFromPage(path: string, response: Response): Promise<void> {
  const name = await quranCacheName();
  if (!name) throw new OfflineQuranError("network", "সার্ভিস ওয়ার্কার সক্রিয় নয়");
  const cache = await caches.open(name);
  await cache.put(path, response);
}

/**
 * Fetches one surah and guarantees it really is in the cache before resolving.
 * The service worker normally does the storing (it sees the request first); the
 * page-side write below only runs when no worker is controlling the tab yet.
 */
export async function downloadSurah(surah: number, signal?: AbortSignal): Promise<void> {
  if (typeof caches === "undefined") {
    throw new OfflineQuranError("network", "এই ব্রাউজারে অফলাইন সাপোর্ট নেই");
  }

  let response: Response;
  try {
    response = await fetch(surahPath(surah), {
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new OfflineQuranError("network", "ইন্টারনেট সংযোগ নেই");
  }

  // 504 = the worker's "nothing cached and no network" fallback.
  if (response.status === 504) throw new OfflineQuranError("offline-miss", "অফলাইনে নেই");
  if (!response.ok) throw new OfflineQuranError("server", `সারভার থেকে ${response.status}`);

  const forCache = response.clone();
  const payload = (await response.json().catch(() => null)) as SurahPayload | null;
  if (!payload || !Array.isArray(payload.ayahs) || payload.ayahs.length === 0) {
    throw new OfflineQuranError("invalid", "ডেটা পাওয়া যায়নি");
  }

  if (!(await isSurahCached(surah))) await storeFromPage(surahPath(surah), forCache);
  if (!(await isSurahCached(surah))) {
    throw new OfflineQuranError("network", "ক্যাশেতে সংরক্ষণ করা যায়নি");
  }
}

export type BatchState = {
  total: number;
  completed: number;
  saved: number;
  failed: number;
  failures: number[];
  running: boolean;
};

/**
 * Saves a list of surahs with limited concurrency. One failing surah never
 * aborts the run — failures are tallied and returned so the UI can retry them.
 * Already-saved surahs are skipped, which is what makes the run resumable.
 */
export async function downloadSurahs(
  surahs: number[],
  options: {
    concurrency?: number;
    isCancelled?: () => boolean;
    onProgress?: (state: BatchState) => void;
  } = {},
): Promise<{ saved: number[]; failures: number[] }> {
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, 8));
  const queue = surahs.slice();
  const saved: number[] = [];
  const failures: number[] = [];
  const known = new Set(readManifest());
  const total = queue.length;

  const emit = (running: boolean) =>
    options.onProgress?.({
      total,
      completed: saved.length + failures.length,
      saved: saved.length,
      failed: failures.length,
      failures: failures.slice(),
      running,
    });

  emit(true);

  const worker = async () => {
    while (queue.length > 0) {
      if (options.isCancelled?.()) return;
      const surah = queue.shift();
      if (surah === undefined) return;
      try {
        await downloadSurah(surah);
        saved.push(surah);
        known.add(surah);
        writeManifest(known);
      } catch (error) {
        if (options.isCancelled?.()) return;
        if ((error as { name?: string })?.name === "AbortError") return;
        failures.push(surah);
      }
      emit(true);
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, Math.max(total, 1)) }, () => worker()));
  emit(false);

  return { saved, failures };
}

/* ── reading ─────────────────────────────────────────────────────────── */

export type SurahReadResult = { ayahs: OfflineAyah[]; cacheState: string | null };

/** Reads a surah straight out of Cache Storage (works even with no worker). */
async function readSurahFromCache(surah: number): Promise<OfflineAyah[] | null> {
  if (typeof caches === "undefined") return null;
  try {
    const hit = await caches.match(surahCacheKey(surah), { ignoreVary: true });
    if (!hit) return null;
    const payload = (await hit.json().catch(() => null)) as SurahPayload | null;
    if (!payload || !Array.isArray(payload.ayahs) || payload.ayahs.length === 0) return null;
    return payload.ayahs;
  } catch {
    return null;
  }
}

/**
 * Loads a surah for the offline reader. It normally goes through the service
 * worker, so a saved surah resolves with the network off (`X-SW-Cache: hit`)
 * and an unsaved one gets the worker's explicit 504. If the request itself
 * fails (worker not active yet) we fall back to a direct cache read.
 */
export async function fetchSurah(surah: number, signal?: AbortSignal): Promise<SurahReadResult> {
  let response: Response;
  try {
    response = await fetch(surahPath(surah), { credentials: "same-origin", signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    const cached = await readSurahFromCache(surah);
    if (cached) return { ayahs: cached, cacheState: "hit" };
    throw new OfflineQuranError("network", "ইন্টারনেট সংযোগ নেই");
  }

  const cacheState = response.headers.get("X-SW-Cache");
  if (response.status === 504) {
    const cached = await readSurahFromCache(surah);
    if (cached) return { ayahs: cached, cacheState: "hit" };
    throw new OfflineQuranError("offline-miss", "অফলাইনে নেই");
  }
  if (!response.ok) throw new OfflineQuranError("server", `সারভার থেকে ${response.status}`);

  const payload = (await response.json().catch(() => null)) as SurahPayload | null;
  if (!payload || !Array.isArray(payload.ayahs) || payload.ayahs.length === 0) {
    throw new OfflineQuranError("invalid", "ডেটা পাওয়া যায়নি");
  }
  return { ayahs: payload.ayahs, cacheState };
}

/* ── cache maintenance ───────────────────────────────────────────────── */

/**
 * Removes ONLY Quran API entries (never the page/asset caches) — they can live
 * in the worker's `muhasabah-quran-*` cache or, from an older build, in the
 * generic runtime cache, so every app cache is scanned.
 */
export async function clearQuranCache(): Promise<number> {
  writeManifest([]);
  if (typeof caches === "undefined") return 0;
  let removed = 0;
  try {
    const names = await caches.keys();
    for (const name of names) {
      if (!name.startsWith(APP_CACHE_PREFIX)) continue;
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const request of keys) {
        if (!isQuranApiUrl(request.url)) continue;
        if (await cache.delete(request, { ignoreVary: true })) removed += 1;
      }
    }
  } catch {
    /* best effort — the manifest is already cleared */
  }
  return removed;
}

export type StorageInfo = { usage: number | null; quota: number | null; percent: number | null };

export async function estimateStorage(): Promise<StorageInfo> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { usage: null, quota: null, percent: null };
  }
  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (usage === undefined || quota === undefined) return { usage: null, quota: null, percent: null };
    return { usage, quota, percent: quota > 0 ? Math.round((usage / quota) * 100) : null };
  } catch {
    return { usage: null, quota: null, percent: null };
  }
}

/** "1.4 MB" / "2.1 GB" with Bengali digits. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes >= 1024 ** 3) return `${toBn((bytes / 1024 ** 3).toFixed(1))} GB`;
  if (bytes >= 1024 ** 2) return `${toBn((bytes / 1024 ** 2).toFixed(1))} MB`;
  if (bytes >= 1024) return `${toBn((bytes / 1024).toFixed(1))} KB`;
  return `${toBn(bytes)} B`;
}

/* ── service worker plumbing ─────────────────────────────────────────── */

export type SwState = "unsupported" | "pending" | "ready";

/**
 * `ready` = a worker controls the tab (offline mode actually works),
 * `pending` = registered but not controlling yet, `unsupported` = no SW API.
 */
export async function getServiceWorkerState(): Promise<SwState> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return "unsupported";
  if (navigator.serviceWorker.controller) return "ready";
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration ? "pending" : "unsupported";
  } catch {
    return "unsupported";
  }
}

/**
 * Asks the worker to pin a route's HTML, so it stays reachable offline even
 * when it was opened through a client-side (RSC) navigation instead of a full
 * page load. Never rejects.
 */
export function requestPagePrecache(path: string): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready
    .then((registration) => registration.active?.postMessage({ type: "PRECACHE_PAGE", url: path }))
    .catch(() => {});
}
