"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Per-device hadith reading state (localStorage): bookmarks, last read
 * position and reader preferences. Every read/write is wrapped — private
 * mode or blocked storage simply behaves like an empty store.
 */

export type HadithBookmark = { book: string; section: number; number: number; preview: string; savedAt: number };
export type HadithLastRead = { book: string; section: number; number?: number; at: number };
export type HadithPrefs = { fontSize: number; showArabic: boolean };

const KEYS = { bookmarks: "muhasabah.hadith.bookmarks", last: "muhasabah.hadith.last", prefs: "muhasabah.hadith.prefs" } as const;
const EVENT = "muhasabah:hadith-storage";
export const DEFAULT_PREFS: HadithPrefs = { fontSize: 2, showArabic: true };
export const FONT_SIZES = ["text-[15px] leading-7", "text-base leading-8", "text-[17px] leading-8", "text-lg leading-9", "text-xl leading-10"];

const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    raw = null;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  try {
    value = raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    value = fallback;
  }
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep going */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function useStored<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
}

const EMPTY: HadithBookmark[] = [];

export function useBookmarks() {
  const bookmarks = useStored<HadithBookmark[]>(KEYS.bookmarks, EMPTY);
  const isSaved = useCallback((book: string, number: number) => bookmarks.some((b) => b.book === book && b.number === number), [bookmarks]);
  const toggle = useCallback((entry: Omit<HadithBookmark, "savedAt">) => {
    const current = read<HadithBookmark[]>(KEYS.bookmarks, EMPTY);
    const exists = current.some((b) => b.book === entry.book && b.number === entry.number);
    write(KEYS.bookmarks, exists ? current.filter((b) => !(b.book === entry.book && b.number === entry.number)) : [{ ...entry, savedAt: Date.now() }, ...current].slice(0, 500));
    return !exists;
  }, []);
  return { bookmarks, isSaved, toggle };
}

export function useLastRead() {
  return useStored<HadithLastRead | null>(KEYS.last, null);
}

export function saveLastRead(value: Omit<HadithLastRead, "at">) {
  write(KEYS.last, { ...value, at: Date.now() });
}

export function usePrefs() {
  const prefs = useStored<HadithPrefs>(KEYS.prefs, DEFAULT_PREFS);
  const update = useCallback((patch: Partial<HadithPrefs>) => write(KEYS.prefs, { ...read(KEYS.prefs, DEFAULT_PREFS), ...patch }), []);
  return { prefs: { ...DEFAULT_PREFS, ...prefs }, update };
}
