"use client";

import { Check, Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { BD_CITIES, DHAKA, isDhaka, isValidTimeZone, saveLocation, type PrayerLocation } from "@/lib/prayer-location";
import { usePrayerLocation } from "@/lib/use-prayer-location";
import { cn } from "@/lib/utils";

type GeoResult = { id: number; name: string; latitude: number; longitude: number; timezone?: string; country?: string; admin1?: string };

/** Button (location name) + popup: GPS, worldwide city search, quick Bangladesh picks. */
export function PrayerLocationButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const location = usePrayerLocation();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`অবস্থান: ${location.name} — পরিবর্তন করুন`}
        className={cn("inline-flex max-w-[11rem] shrink-0 items-center gap-1 rounded-md bg-card/80 px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-hairline transition hover:text-foreground", className)}
      >
        <MapPin className="size-3.5 shrink-0" /> <span className="truncate">{location.name}</span>
      </button>
      <PrayerLocationSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function PrayerLocationSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = usePrayerLocation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      queueMicrotask(() => setResults([]));
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearching(true);
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=8&language=bn&format=json`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { results: [] }))
        .then((data: { results?: GeoResult[] }) => setResults(data.results ?? []))
        .catch(() => undefined)
        .finally(() => setSearching(false));
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function choose(location: PrayerLocation) {
    saveLocation(location);
    toast.success(`${location.name} এর সময় দেখানো হচ্ছে`);
    onClose();
  }

  function chooseResult(result: GeoResult) {
    const tz = isValidTimeZone(result.timezone) ? result.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone;
    choose({ name: [result.name, result.country].filter(Boolean).join(", "), lat: Number(result.latitude.toFixed(4)), lon: Number(result.longitude.toFixed(4)), tz });
  }

  function useGps() {
    if (!navigator.geolocation) return toast.error("এই ব্রাউজারে অবস্থান সুবিধা নেই।");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const lat = Number(coords.latitude.toFixed(3));
        const lon = Number(coords.longitude.toFixed(3));
        let name = "আমার অবস্থান";
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bn`, { signal: AbortSignal.timeout(6000) });
          if (response.ok) {
            const place = (await response.json()) as { city?: string; locality?: string; principalSubdivision?: string };
            name = place.city || place.locality || place.principalSubdivision || name;
          }
        } catch {
          /* the coordinates are enough */
        }
        setLocating(false);
        choose({ name, lat, lon, tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
      },
      () => {
        setLocating(false);
        toast.error("অবস্থান পাওয়া যায়নি। অনুমতি দিন বা শহর খুঁজে বেছে নিন।");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  return (
    <ResponsiveSheet open={open} onClose={onClose} title="সময়ের অবস্থান" description="নামাজ, সেহরি ও ইফতারের সময় এই জায়গার জন্য হিসাব হবে।">
      <div className="space-y-5">
        <button
          type="button"
          onClick={useGps}
          disabled={locating}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-active text-sm font-semibold text-on-active shadow-sm transition hover:brightness-110 disabled:opacity-70"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />} আমার বর্তমান অবস্থান ব্যবহার করুন
        </button>

        <div>
          <label className="relative block">
            <span className="sr-only">শহর খুঁজুন</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="বিশ্বের যেকোনো শহর খুঁজুন… (যেমন: Riyadh, London, মক্কা)"
              className="field-3d h-11 w-full rounded-xl pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
            />
          </label>
          {searching ? <p className="mt-2 text-xs text-muted-foreground">খোঁজা হচ্ছে…</p> : null}
          {results.length ? (
            <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
              {results.map((result) => (
                <li key={result.id}>
                  <button type="button" onClick={() => chooseResult(result)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-muted/60">
                    <MapPin className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">
                      <b className="font-semibold">{result.name}</b>
                      <span className="text-muted-foreground">{[result.admin1, result.country].filter(Boolean).map((part) => `, ${part}`).join("")}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 && !searching ? (
            <p className="mt-2 text-xs text-muted-foreground">কোনো শহর পাওয়া যায়নি। ইংরেজি বানানে চেষ্টা করুন।</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-muted-foreground">বাংলাদেশের প্রধান শহর</p>
          <div className="flex flex-wrap gap-1.5">
            {BD_CITIES.map((city) => {
              const on = current.lat === city.lat && current.lon === city.lon;
              return (
                <button
                  key={city.name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => choose(city)}
                  className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition", on ? "bg-active text-on-active shadow-sm" : "bg-surface-sunken text-muted-foreground hover:text-foreground")}
                >
                  {on ? <Check className="size-3.5" /> : null}
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          আপনার বেছে নেওয়া অবস্থান শুধু এই ডিভাইসে সংরক্ষিত থাকে; সময় হিসাবের জন্যই ব্যবহৃত হয়। আসরের সময় হানাফী মতে গণনা করা হয়।
          {isDhaka(current) ? "" : (
            <>
              {" "}
              <button type="button" className="font-semibold text-primary underline underline-offset-4" onClick={() => choose(DHAKA)}>
                ঢাকায় ফিরে যান
              </button>
            </>
          )}
        </p>
      </div>
    </ResponsiveSheet>
  );
}
