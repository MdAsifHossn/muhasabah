/**
 * Where the prayer times are calculated for. Stored only on this device
 * (localStorage); Dhaka is the default so guests and the server render match.
 */
export type PrayerLocation = { name: string; lat: number; lon: number; tz: string };

export const DHAKA: PrayerLocation = { name: "ঢাকা", lat: 23.8103, lon: 90.4125, tz: "Asia/Dhaka" };

/** Quick picks for Bangladesh (all Asia/Dhaka). */
export const BD_CITIES: PrayerLocation[] = [
  DHAKA,
  { name: "চট্টগ্রাম", lat: 22.3569, lon: 91.7832, tz: "Asia/Dhaka" },
  { name: "সিলেট", lat: 24.8949, lon: 91.8687, tz: "Asia/Dhaka" },
  { name: "রাজশাহী", lat: 24.3745, lon: 88.6042, tz: "Asia/Dhaka" },
  { name: "খুলনা", lat: 22.8456, lon: 89.5403, tz: "Asia/Dhaka" },
  { name: "বরিশাল", lat: 22.701, lon: 90.3535, tz: "Asia/Dhaka" },
  { name: "রংপুর", lat: 25.7439, lon: 89.2752, tz: "Asia/Dhaka" },
  { name: "ময়মনসিংহ", lat: 24.7471, lon: 90.4203, tz: "Asia/Dhaka" },
  { name: "কুমিল্লা", lat: 23.4607, lon: 91.1809, tz: "Asia/Dhaka" },
  { name: "কক্সবাজার", lat: 21.4272, lon: 92.0058, tz: "Asia/Dhaka" },
];

const KEY = "prayer.location.v1";
const EVENT = "prayer-location-change";

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function parse(value: unknown): PrayerLocation | null {
  if (!value || typeof value !== "object") return null;
  const { name, lat, lon, tz } = value as Record<string, unknown>;
  if (typeof name !== "string" || typeof lat !== "number" || typeof lon !== "number" || !isValidTimeZone(tz)) return null;
  if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return null;
  return { name: name.slice(0, 80) || "আমার অবস্থান", lat, lon, tz };
}

let cache: PrayerLocation | null = null;

export function readLocation(): PrayerLocation {
  if (typeof window === "undefined") return DHAKA;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = (raw && parse(JSON.parse(raw))) || DHAKA;
  } catch {
    cache = DHAKA;
  }
  return cache;
}

export function saveLocation(location: PrayerLocation) {
  const next = parse(location) ?? DHAKA;
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — the choice lasts until reload */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const isDhaka = (location: PrayerLocation) => location.lat === DHAKA.lat && location.lon === DHAKA.lon && location.tz === DHAKA.tz;

/** Time zone clocks should use: the chosen place's zone on the client, Dhaka on the server. */
export function getPrayerTimeZone(): string {
  return readLocation().tz;
}

export const PRAYER_LOCATION_EVENT = EVENT;
export const PRAYER_LOCATION_KEY = KEY;
/** Called by the hook's store: forget the in-memory copy. */
export function resetLocationCache() {
  cache = null;
}
