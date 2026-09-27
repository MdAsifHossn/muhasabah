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

export function formatBanglaDate(date: Date) {
  return format(new TZDate(date, APP_TIME_ZONE), "d MMMM yyyy", { locale: bn });
}

export function formatEnglishDate(date: Date = new Date()): string {
  return format(new TZDate(date, APP_TIME_ZONE), "eeee, d MMMM yyyy");
}

export function formatHijriDate(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("bn-BD-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const adjusted = new Date(date); adjusted.setDate(adjusted.getDate() - 1);
    return formatter.format(adjusted) + " হিজরী";
  } catch {
    try {
      const formatter = new Intl.DateTimeFormat("bn-BD-u-ca-islamic", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const adjusted = new Date(date); adjusted.setDate(adjusted.getDate() - 1);
    return formatter.format(adjusted) + " হিজরী";
    } catch {
      return "হিজরী তারিখ";
    }
  }
}

export function getCycleDayNumber(startDate: Date, date = getBangladeshToday()) {
  return differenceInCalendarDays(startOfBangladeshDay(date), startOfBangladeshDay(startDate)) + 1;
}
