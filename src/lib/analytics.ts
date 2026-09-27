import { DailyEntryStatus } from "@prisma/client";
import { differenceInCalendarDays } from "date-fns";

import { getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";

export function getElapsedCycleDays(startDate: Date, endDate: Date, today = getBangladeshToday()) {
  if (today < startDate) return 0;
  return Math.min(differenceInCalendarDays(startOfBangladeshDay(today), startOfBangladeshDay(startDate)) + 1, differenceInCalendarDays(startOfBangladeshDay(endDate), startOfBangladeshDay(startDate)) + 1);
}

export function summarizeEntries(entries: Array<{ date: Date; status: DailyEntryStatus; totalScore: number; maxPossibleScore: number; completionPercentage: number }>, elapsedDays: number) {
  const submitted = entries.filter((entry) => entry.status !== DailyEntryStatus.DRAFT);
  const average = submitted.length ? Math.round(submitted.reduce((sum, entry) => sum + entry.completionPercentage, 0) / submitted.length) : 0;
  const submittedKeys = new Set(submitted.map((entry) => entry.date.toISOString().slice(0, 10)));
  let cursor: Date = startOfBangladeshDay(getBangladeshToday());
  let streak = 0;
  while (submittedKeys.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor = new Date(cursor); cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return { submittedDays: submitted.length, missedDays: Math.max(elapsedDays - submitted.length, 0), average, streak };
}