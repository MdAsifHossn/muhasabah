"use client";

import { useCallback, useSyncExternalStore } from "react";

/** "পরে পড়ব" — saved book ids per device (localStorage, guarded). */
const KEY = "library.saved.v1";
const EVENT = "library-saved";
const EMPTY: number[] = [];
let cached: number[] | null = null;

function read(): number[] {
  if (cached) return cached;
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    cached = Array.isArray(value) ? value.filter((item) => Number.isInteger(item)) : [];
  } catch {
    cached = [];
  }
  return cached;
}

function subscribe(callback: () => void) {
  // Same-tab toggles already updated `cached` (kept even when storage is blocked); only other tabs invalidate it.
  const local = () => callback();
  const remote = () => {
    cached = null;
    callback();
  };
  window.addEventListener(EVENT, local);
  window.addEventListener("storage", remote);
  return () => {
    window.removeEventListener(EVENT, local);
    window.removeEventListener("storage", remote);
  };
}

export function useSavedBooks(): [number[], (id: number) => boolean] {
  const saved = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: number) => {
    const current = read();
    const exists = current.includes(id);
    const next = exists ? current.filter((item) => item !== id) : [id, ...current];
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked — keep working in memory */
    }
    cached = next;
    window.dispatchEvent(new Event(EVENT));
    return !exists;
  }, []);
  return [saved, toggle];
}
