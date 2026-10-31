"use client";

import { useCallback, useSyncExternalStore } from "react";

import type {
  QuranScript,
  ReaderTheme,
  ViewMode,
} from "@/components/quran/types";
import { RECITERS } from "@/components/quran/types";

/**
 * Per-device Quran state in localStorage (works for guests too):
 * reading preferences, the last-read position and ayah bookmarks.
 * Every access is wrapped — private mode / blocked storage just falls back
 * to defaults, never breaks the reader.
 */

export type ReaderPrefs = {
  view: ViewMode;
  /** @deprecated kept for old stored prefs — use arabicPx. */
  arabicStep: number;
  /** @deprecated kept for old stored prefs — use banglaPx. */
  banglaStep: number;
  arabicPx: number;
  banglaPx: number;
  script: QuranScript;
  theme: ReaderTheme;
  reciter: string;
  /** Playback speed for recitation. */
  speed: number;
  /** Repeat each ayah this many times before moving on (1 = no repeat). */
  repeat: number;
};

export type LastRead = {
  mode: "surah" | "juz";
  id: number;
  surah: number;
  ayah: number;
  at: number;
};
export type Bookmark = { surah: number; ayah: number; at: number };

export const DEFAULT_PREFS: ReaderPrefs = {
  // Mushaf (continuous Arabic) is the default view.
  view: "mushaf",
  arabicStep: 2,
  banglaStep: 1,
  arabicPx: 30,
  banglaPx: 17,
  script: "indopak",
  theme: "emerald",
  reciter: RECITERS[0].id,
  speed: 1,
  repeat: 1,
};

const KEYS = {
  prefs: "quran.prefs.v4",
  last: "quran.lastRead.v2",
  bookmarks: "quran.bookmarks.v2",
  favourites: "quran.favourites.v1",
} as const;
const EVENT = "quran-storage";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw ? JSON.parse(raw) : [];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep working in memory */
  }
  cache.delete(key);
  window.dispatchEvent(new Event(EVENT));
}

/* Snapshot cache so useSyncExternalStore gets a stable reference. */
const cache = new Map<string, unknown>();
function snapshot<T>(key: string, load: () => T): T {
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key) as T;
}

function subscribe(callback: () => void) {
  const handle = (event: Event) => {
    if (event instanceof StorageEvent) cache.clear();
    callback();
  };
  window.addEventListener(EVENT, handle);
  window.addEventListener("storage", handle);
  return () => {
    window.removeEventListener(EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

export function usePrefs(): [
  ReaderPrefs,
  (patch: Partial<ReaderPrefs>) => void,
] {
  const prefs = useSyncExternalStore(
    subscribe,
    () => snapshot(KEYS.prefs, () => read(KEYS.prefs, DEFAULT_PREFS)),
    () => DEFAULT_PREFS,
  );
  const update = useCallback(
    (patch: Partial<ReaderPrefs>) =>
      write(KEYS.prefs, { ...read(KEYS.prefs, DEFAULT_PREFS), ...patch }),
    [],
  );
  return [prefs, update];
}

export function useLastRead(): LastRead | null {
  return useSyncExternalStore(
    subscribe,
    () => snapshot(KEYS.last, () => read<LastRead | null>(KEYS.last, null)),
    () => null,
  );
}

export function saveLastRead(value: Omit<LastRead, "at">) {
  write(KEYS.last, { ...value, at: Date.now() });
}

const EMPTY: Bookmark[] = [];

export function useBookmarks(): [
  Bookmark[],
  (surah: number, ayah: number) => boolean,
] {
  const list = useSyncExternalStore(
    subscribe,
    () => snapshot(KEYS.bookmarks, () => readArray<Bookmark>(KEYS.bookmarks)),
    () => EMPTY,
  );
  /** Toggles a bookmark; returns true when it is now bookmarked. */
  const toggle = useCallback((surah: number, ayah: number) => {
    const current = readArray<Bookmark>(KEYS.bookmarks);
    const exists = current.some(
      (item) => item.surah === surah && item.ayah === ayah,
    );
    const next = exists
      ? current.filter((item) => !(item.surah === surah && item.ayah === ayah))
      : [{ surah, ayah, at: Date.now() }, ...current].slice(0, 200);
    write(KEYS.bookmarks, next);
    return !exists;
  }, []);
  return [list, toggle];
}

const EMPTY_FAVS: number[] = [];

/** Favourite surahs (numbers), newest first. */
export function useFavouriteSurahs(): [number[], (surah: number) => boolean] {
  const list = useSyncExternalStore(
    subscribe,
    () => snapshot(KEYS.favourites, () => readArray<number>(KEYS.favourites)),
    () => EMPTY_FAVS,
  );
  const toggle = useCallback((surah: number) => {
    const current = readArray<number>(KEYS.favourites);
    const exists = current.includes(surah);
    write(
      KEYS.favourites,
      exists ? current.filter((item) => item !== surah) : [surah, ...current],
    );
    return !exists;
  }, []);
  return [list, toggle];
}
