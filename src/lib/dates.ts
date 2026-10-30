import { TZDate } from "@date-fns/tz";
import { differenceInCalendarDays, endOfDay, format, startOfDay } from "date-fns";
import { bn } from "date-fns/locale";

export const APP_TIME_ZONE = "Asia/Dhaka";

export function getBangladeshToday(now = new Date()): Date {
  return startOfDay(new TZDate(now, APP_TIME_ZONE));
}

export function startOfBangladeshDay(date: Date) {
  return startOfDay(new TZDate(date, APP_TIME_ZONE));
}

export function endOfBangladeshDay(date: Date) {
  return endOfDay(new TZDate(date, APP_TIME_ZONE));
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Latin digits → Bangla digits. */
export function toBanglaDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)]);
}

export function formatBanglaDate(date: Date) {
  return toBanglaDigits(format(new TZDate(date, APP_TIME_ZONE), "d MMMM yyyy", { locale: bn }));
}

export function formatEnglishDate(date: Date = new Date()): string {
  return format(new TZDate(date, APP_TIME_ZONE), "eeee, d MMMM yyyy");
}

/**
 * Hijri date in Bangla (Umm al-Qura, one day back for the Bangladesh moon
 * sighting). The locale's era word ("যুগ") is dropped; we append "হিজরি".
 */
export function formatHijriDate(date: Date = new Date()): string {
  const adjusted = new Date(date);
  adjusted.setDate(adjusted.getDate() - 1);
  for (const calendar of ["islamic-umalqura", "islamic"]) {
    try {
      const parts = new Intl.DateTimeFormat(`bn-BD-u-ca-${calendar}`, { day: "numeric", month: "long", year: "numeric", timeZone: APP_TIME_ZONE }).formatToParts(adjusted);
      const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
      return toBanglaDigits(`${pick("day")} ${pick("month")} ${pick("year")} হিজরি`);
    } catch {
      /* try the next calendar */
    }
  }
  return "হিজরি তারিখ";
}

const WEEKDAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
export type WeekdayName = (typeof WEEKDAYS)[number];

/**
 * Day of week in Bangladesh time. Never use `new Date(x).getDay()` on the
 * server: Vercel runs in UTC, where the start of a Dhaka day (18:00 UTC the
 * previous evening) falls on the PREVIOUS weekday — that made Friday-only
 * amals appear on Thursday.
 */
export function getBangladeshWeekday(date: Date = new Date()): WeekdayName {
  return WEEKDAYS[new TZDate(date, APP_TIME_ZONE).getDay()];
}

/** `YYYY-MM-DD` key of the Bangladesh calendar day (stable map key across runtimes). */
export function bangladeshDateKey(date: Date): string {
  return format(new TZDate(date, APP_TIME_ZONE), "yyyy-MM-dd");
}

export function getCycleDayNumber(startDate: Date, date = getBangladeshToday()) {
  return differenceInCalendarDays(startOfBangladeshDay(date), startOfBangladeshDay(startDate)) + 1;
}
