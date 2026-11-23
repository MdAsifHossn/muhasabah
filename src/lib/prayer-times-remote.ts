import { timingFromAladhan, type PrayerTiming } from "@/lib/prayer-times";

/** Karachi (Hanafi tradition) is the common method across South Asia; elsewhere AlAdhan picks one for the coordinates. */
const SOUTH_ASIA_ZONES = new Set(["Asia/Dhaka", "Asia/Karachi", "Asia/Kolkata", "Asia/Calcutta", "Asia/Kathmandu", "Asia/Colombo"]);

/** Today's timings (in `tz`) for coordinates, from AlAdhan; null when the upstream fails. Server-only. */
export async function fetchPrayerTiming(lat: number, lon: number, tz: string, name: string): Promise<PrayerTiming | null> {
  const [day, month, year] = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()).split("/");
  const url = new URL(`https://api.aladhan.com/v1/timings/${day}-${month}-${year}`);
  url.searchParams.set("latitude", lat.toFixed(2));
  url.searchParams.set("longitude", lon.toFixed(2));
  url.searchParams.set("school", "1");
  url.searchParams.set("timezonestring", tz);
  if (SOUTH_ASIA_ZONES.has(tz)) url.searchParams.set("method", "1");
  try {
    const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: { timings?: Record<string, string> } };
    return json.data?.timings ? timingFromAladhan(json.data.timings, name) : null;
  } catch {
    return null;
  }
}
