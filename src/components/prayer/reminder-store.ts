"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { dhakaDateKey } from "@/lib/forbidden-times";
import { ALADHAN_DHAKA_URL, fallbackMinutes, timingsToMinutes, type PrayerTiming } from "@/lib/prayer-times";

/**
 * Per-device prayer-reminder state (localStorage, every access guarded):
 * - settings: which reminders are on
 * - today's prayer minutes, fetched once per Dhaka day from AlAdhan
 * - per-day event state: dismissed / snoozed-until / notified
 */

export type ReminderSettings = {
  /** Full-screen overlay at the start of each waqt. */
  waqt: boolean;
  /** Full-screen overlay at the start of each forbidden window. */
  forbidden: boolean;
  /** Also fire a browser Notification (needs permission). */
  notify: boolean;
};

export const DEFAULT_SETTINGS: ReminderSettings = { waqt: true, forbidden: true, notify: false };

const SETTINGS_KEY = "prayer.reminder.settings.v1";
const TIMES_KEY = "prayer.times.v1";
const EVENT = "prayer-reminder-storage";

function safeRead<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — keep working in memory */
  }
}

/* ── settings ───────────────────────────────────────────────────────── */

let settingsCache: ReminderSettings | null = null;

function readSettings(): ReminderSettings {
  if (!settingsCache) settingsCache = { ...DEFAULT_SETTINGS, ...(safeRead<Partial<ReminderSettings>>(SETTINGS_KEY) ?? {}) };
  return settingsCache;
}

function subscribe(callback: () => void) {
  const handle = (event: Event) => {
    if (event instanceof StorageEvent && event.key !== SETTINGS_KEY) return;
    settingsCache = null;
    callback();
  };
  window.addEventListener(EVENT, handle);
  window.addEventListener("storage", handle);
  return () => {
    window.removeEventListener(EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

export function useReminderSettings(): [ReminderSettings, (patch: Partial<ReminderSettings>) => void] {
  const settings = useSyncExternalStore(subscribe, readSettings, () => DEFAULT_SETTINGS);
  const update = useCallback((patch: Partial<ReminderSettings>) => {
    safeWrite(SETTINGS_KEY, { ...readSettings(), ...patch });
    settingsCache = null;
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [settings, update];
}

/* ── today's prayer minutes ─────────────────────────────────────────── */

type CachedTimes = { date: string; minutes: PrayerTiming["minutes"] };

/** Today's Dhaka prayer minutes: cached per day, refreshed from AlAdhan, fallback when offline. */
export function usePrayerMinutes(initial?: PrayerTiming["minutes"]): PrayerTiming["minutes"] {
  const [minutes, setMinutes] = useState<PrayerTiming["minutes"]>(initial ?? fallbackMinutes);

  useEffect(() => {
    const today = dhakaDateKey();
    const cached = safeRead<CachedTimes>(TIMES_KEY);
    let active = true;
    if (cached?.date === today) {
      // Defer so the first render matches the server markup.
      queueMicrotask(() => active && setMinutes(cached.minutes));
      return () => {
        active = false;
      };
    }
    if (initial) {
      safeWrite(TIMES_KEY, { date: today, minutes: initial } satisfies CachedTimes);
      return () => {
        active = false;
      };
    }
    fetch(ALADHAN_DHAKA_URL)
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { data?: { timings?: Record<string, string> } } | null) => {
        const timings = json?.data?.timings;
        if (!active || !timings) return;
        const next = timingsToMinutes(timings);
        safeWrite(TIMES_KEY, { date: today, minutes: next } satisfies CachedTimes);
        setMinutes(next);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [initial]);

  return minutes;
}

/* ── per-day event state ────────────────────────────────────────────── */

type EventState = { dismissed?: boolean; snoozeUntil?: number; notified?: boolean };

function eventKey(eventId: string, date = dhakaDateKey()) {
  return `prayer.reminder.${date}.${eventId}`;
}

export function getEventState(eventId: string): EventState {
  return safeRead<EventState>(eventKey(eventId)) ?? {};
}

export function setEventState(eventId: string, patch: EventState) {
  safeWrite(eventKey(eventId), { ...getEventState(eventId), ...patch });
}

/** Drop state rows from previous days so storage never grows. */
export function pruneOldEventState() {
  try {
    const today = dhakaDateKey();
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("prayer.reminder.") && !key.startsWith(`prayer.reminder.${today}.`) && key !== SETTINGS_KEY) window.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
