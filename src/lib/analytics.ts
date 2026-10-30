import type { Gender } from "@prisma/client";
import { differenceInCalendarDays } from "date-fns";

import { buildReport, laterOf, reportEntrySelect, reportItemSelect } from "@/components/amalnama/report-data";
import { getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

/** Days of the cycle that have started so far (0 before the cycle, capped at its length). */
export function getElapsedCycleDays(startDate: Date, endDate: Date, today = getBangladeshToday()) {
  const day = startOfBangladeshDay(today);
  const start = startOfBangladeshDay(startDate);
  if (day.getTime() < start.getTime()) return 0;
  return Math.min(differenceInCalendarDays(day, start) + 1, differenceInCalendarDays(startOfBangladeshDay(endDate), start) + 1);
}

/**
 * Loads one member's report for [start, end] (Bangladesh days), never earlier
 * than the day they joined. All amal items are loaded (inactive ones still
 * count on days they were answered); applicability is decided per day.
 */
export async function loadMemberReport(member: { id: string; gender: Gender | string; joinedAt: Date }, start: Date, end: Date) {
  const from = laterOf(startOfBangladeshDay(start), startOfBangladeshDay(member.joinedAt));
  const [items, entries] = await Promise.all([
    prisma.amalItem.findMany({ orderBy: { order: "asc" }, select: reportItemSelect }),
    prisma.dailyAmalEntry.findMany({ where: { userId: member.id, date: { gte: from, lte: end } }, orderBy: { date: "asc" }, select: reportEntrySelect }),
  ]);
  return { items, report: buildReport({ items, entries, gender: member.gender, start: from, end }) };
}
