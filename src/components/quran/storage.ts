"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { ReaderTheme, ViewMode } from "@/components/quran/types";
import { RECITERS } from "@/components/quran/types";

/**
 * Per-device Quran state in localStorage (works for guests too):
 * reading preferences, the last-read position and ayah bookmarks.
 * Every access is wrapped — private mode / blocked storage just falls back
 * to defaults, never breaks the reader.
 */

export type ReaderPrefs = {
  view: ViewMode;
  arabicStep: number;
  banglaStep: number;
  theme: ReaderTheme;
  reciter: string;
};

export type LastRead = { mode: "surah" | "juz"; id: number; surah: number; ayah: number; at: number };
export type Bookmark = { surah: number; ayah: number; at: number };

export const DEFAULT_PREFS: ReaderPrefs = { view: "both", arabicStep: 2, banglaStep: 1, theme: "app", reciter: RECITERS[0].id };

const KEYS = { prefs: "quran.prefs.v2", last: "quran.lastRead.v2", bookmarks: "quran.bookmarks.v2" } as const;
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

export function usePrefs(): [ReaderPrefs, (patch: Partial<ReaderPrefs>) => void] {
  const prefs = useSyncExternalStore(
    subscribe,
    () => snapshot(KEYS.prefs, () => read(KEYS.prefs, DEFAULT_PREFS)),
    () => DEFAULT_PREFS,
  );
  const update = useCallback((patch: Partial<ReaderPrefs>) => write(KEYS.prefs, { ...read(KEYS.prefs, DEFAULT_PREFS), ...patch }), []);
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

export function useBookmarks(): [Bookmark[], (surah: number, ayah: number) => boolean] {
  const list = useSyncExternalStore(
    subscribe,
    () => snapshot(KEYS.bookmarks, () => readArray<Bookmark>(KEYS.bookmarks)),
    () => EMPTY,
  );
  /** Toggles a bookmark; returns true when it is now bookmarked. */
  const toggle = useCallback((surah: number, ayah: number) => {
    const current = readArray<Bookmark>(KEYS.bookmarks);
    const exists = current.some((item) => item.surah === surah && item.ayah === ayah);
    const next = exists ? current.filter((item) => !(item.surah === surah && item.ayah === ayah)) : [{ surah, ayah, at: Date.now() }, ...current].slice(0, 200);
    write(KEYS.bookmarks, next);
    return !exists;
  }, []);
  return [list, toggle];
}
