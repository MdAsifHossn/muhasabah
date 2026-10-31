import type { PrayerTiming } from "@/lib/prayer-times";

/**
 * নামাজের নিষিদ্ধ সময় (Hanafi, as commonly taught in Bangladesh) and the
 * day's prayer events, derived from the day's prayer minutes (Dhaka).
 * Pure + client-safe: no server imports.
 *
 * All windows are approximate — a few minutes' caution either side is advised.
 */

export type PrayerMinutes = PrayerTiming["minutes"];

export type ForbiddenKey = "sunrise" | "zawal" | "sunset";
export type WaqtKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

export type ForbiddenWindow = { key: ForbiddenKey; label: string; start: number; end: number; note: string };

/** Minutes after sunrise during which prayer is not allowed. */
export const SUNRISE_WINDOW_MIN = 15;
/** Minutes before Dhuhr (zawal / istiwa). */
export const ZAWAL_WINDOW_MIN = 8;
/** Minutes before Maghrib (sun turning yellow until sunset). */
export const SUNSET_WINDOW_MIN = 15;

export const FORBIDDEN_NOTE = "সময়গুলো আনুমানিক — সতর্কতার জন্য দুই পাশে কয়েক মিনিট বেশি সময় হাতে রাখুন।";

export const WAQT_LABELS: Record<WaqtKey, string> = { fajr: "ফজর", dhuhr: "যোহর", asr: "আসর", maghrib: "মাগরিব", isha: "এশা" };
/** Possessive form used in sentences ("যোহরের সময়"). */
const WAQT_OF: Record<WaqtKey, string> = { fajr: "ফজরের", dhuhr: "যোহরের", asr: "আসরের", maghrib: "মাগরিবের", isha: "এশার" };

export function getForbiddenWindows(m: PrayerMinutes): ForbiddenWindow[] {
  return [
    { key: "sunrise", label: "সূর্যোদয়ের সময়", start: m.sunrise, end: m.sunrise + SUNRISE_WINDOW_MIN, note: "সূর্য পুরোপুরি উঠে যাওয়া পর্যন্ত" },
    { key: "zawal", label: "দ্বিপ্রহর (যাওয়াল)", start: m.dhuhr - ZAWAL_WINDOW_MIN, end: m.dhuhr, note: "সূর্য ঠিক মাথার উপরে থাকার সময়" },
    { key: "sunset", label: "সূর্যাস্তের সময়", start: m.maghrib - SUNSET_WINDOW_MIN, end: m.maghrib, note: "সূর্য হলুদ হওয়া থেকে অস্ত যাওয়া পর্যন্ত" },
  ];
}

export function getActiveForbidden(m: PrayerMinutes, now: number): ForbiddenWindow | null {
  return getForbiddenWindows(m).find((window) => now >= window.start && now < window.end) ?? null;
}

/** Start/end of each fard waqt (end = when the next one begins; Isha runs to midnight here). */
export function getWaqtWindows(m: PrayerMinutes): { key: WaqtKey; label: string; start: number; end: number }[] {
  return [
    { key: "fajr", label: WAQT_LABELS.fajr, start: m.fajr, end: m.sunrise },
    { key: "dhuhr", label: WAQT_LABELS.dhuhr, start: m.dhuhr, end: m.asr },
    { key: "asr", label: WAQT_LABELS.asr, start: m.asr, end: m.maghrib - SUNSET_WINDOW_MIN },
    { key: "maghrib", label: WAQT_LABELS.maghrib, start: m.maghrib, end: m.isha },
    { key: "isha", label: WAQT_LABELS.isha, start: m.isha, end: 24 * 60 },
  ];
}

/** An event the reminder can announce. */
export type PrayerEvent = {
  id: string;
  kind: "waqt" | "forbidden";
  label: string;
  start: number;
  end: number;
  message: string;
};

export function getPrayerEvents(m: PrayerMinutes): PrayerEvent[] {
  const waqt = getWaqtWindows(m).map<PrayerEvent>((window) => ({
    id: `waqt-${window.key}`,
    kind: "waqt",
    label: window.label,
    start: window.start,
    end: window.end,
    message: `${WAQT_OF[window.key]} সময় হয়েছে — নামাজের প্রস্তুতি নিন`,
  }));
  const forbiddenMessages: Record<ForbiddenKey, string> = {
    sunrise: "এখন নামাজের নিষিদ্ধ সময় — সূর্যোদয় শেষ হওয়া পর্যন্ত নামাজ পড়বেন না",
    zawal: "এখন নামাজের নিষিদ্ধ সময় — যোহরের ওয়াক্ত শুরু হওয়া পর্যন্ত অপেক্ষা করুন",
    sunset: "এখন নামাজের নিষিদ্ধ সময় — সূর্যাস্ত পর্যন্ত নামাজ পড়বেন না (আজকের আসর ছাড়া)",
  };
  const forbidden = getForbiddenWindows(m).map<PrayerEvent>((window) => ({
    id: `forbidden-${window.key}`,
    kind: "forbidden",
    label: window.label,
    start: window.start,
    end: window.end,
    message: forbiddenMessages[window.key],
  }));
  return [...waqt, ...forbidden].sort((a, b) => a.start - b.start);
}

/* ── time helpers ───────────────────────────────────────────────────── */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const bnDigits = (value: string | number) => String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);

/** Minutes since local midnight in Bangladesh time. */
export function dhakaNowMinutes(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

/** `YYYY-MM-DD` of today in Bangladesh (for per-day storage keys). */
export function dhakaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(date);
}

/** 12-hour clock in Bangla digits, e.g. "১১:৪২". With `period`, adds সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত. */
export function clockBn(minutes: number, period = false): string {
  const total = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h % 12 || 12;
  const text = `${bnDigits(h12)}:${bnDigits(String(m).padStart(2, "0"))}`;
  if (!period) return text;
  const label = h < 4 ? "রাত" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 17 ? "বিকাল" : h < 19 ? "সন্ধ্যা" : "রাত";
  return `${label} ${text}`;
}

export function durationBn(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  return hours > 0 ? `${bnDigits(hours)} ঘণ্টা ${bnDigits(rest)} মিনিট` : `${bnDigits(rest)} মিনিট`;
}
