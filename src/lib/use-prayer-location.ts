"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { DHAKA, isDhaka, type PrayerLocation, PRAYER_LOCATION_EVENT, PRAYER_LOCATION_KEY, readLocation, resetLocationCache } from "@/lib/prayer-location";
import type { PrayerTiming } from "@/lib/prayer-times";

function subscribe(callback: () => void) {
  const handle = (event: Event) => {
    if (event instanceof StorageEvent) {
      if (event.key !== PRAYER_LOCATION_KEY) return;
      resetLocationCache();
    }
    callback();
  };
  window.addEventListener(PRAYER_LOCATION_EVENT, handle);
  window.addEventListener("storage", handle);
  return () => {
    window.removeEventListener(PRAYER_LOCATION_EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

export function usePrayerLocation(): PrayerLocation {
  return useSyncExternalStore(subscribe, readLocation, () => DHAKA);
}

const dateKeyIn = (tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

/**
 * Prayer times for the chosen location. For Dhaka the server-rendered `initial`
 * is used as-is; anywhere else they are fetched (and cached per day) from /api/prayer-times.
 * `timings` is null while a non-Dhaka location is still loading.
 */
export function useLocationTimings(initial?: PrayerTiming) {
  const location = usePrayerLocation();
  const key = `${location.lat},${location.lon},${location.tz}`;
  const useInitial = Boolean(initial) && isDhaka(location);
  const [fetched, setFetched] = useState<{ key: string; timings: PrayerTiming } | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  useEffect(() => {
    if (useInitial) return;
    const cacheKey = `prayer.times.v2:${key}:${dateKeyIn(location.tz)}`;
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const timings = JSON.parse(cached) as PrayerTiming;
        queueMicrotask(() => setFetched({ key, timings }));
        return;
      }
    } catch {
      /* ignore broken cache */
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ lat: String(location.lat), lon: String(location.lon), tz: location.tz, name: location.name });
    fetch(`/api/prayer-times?${params}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<PrayerTiming>) : Promise.reject(new Error("bad status"))))
      .then((timings) => {
        setFetched({ key, timings });
        try {
          window.localStorage.setItem(cacheKey, JSON.stringify(timings));
          // keep only today's entries
          for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
            const name = window.localStorage.key(index);
            if (name?.startsWith("prayer.times.v2:") && name !== cacheKey && !name.endsWith(`:${dateKeyIn(location.tz)}`)) window.localStorage.removeItem(name);
          }
        } catch {
          /* storage blocked */
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFailedKey(key);
      });
    return () => controller.abort();
  }, [key, useInitial, location.tz, location.lat, location.lon, location.name]);

  const timings = useInitial ? (initial as PrayerTiming) : fetched?.key === key ? fetched.timings : null;
  return { timings, location, loading: !timings && failedKey !== key, failed: !timings && failedKey === key };
}
