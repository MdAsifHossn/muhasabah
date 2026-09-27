import { CycleStatus } from "@prisma/client";

import { endOfBangladeshDay, getBangladeshToday, getCycleDayNumber, startOfBangladeshDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export function isDateInsideCycle(date: Date, startDate: Date, endDate: Date) {
  const target = startOfBangladeshDay(date).getTime();
  const start = startOfBangladeshDay(startDate).getTime();
  const end = endOfBangladeshDay(endDate).getTime();
  return target >= start && target <= end;
}

export function getCycleProgress(startDate: Date, endDate: Date, date = getBangladeshToday()) {
  const day = getCycleDayNumber(startDate, date);
  const totalDays = getCycleDayNumber(startDate, endDate);
  const boundedDay = Math.min(Math.max(day, 1), totalDays);
  return { day: boundedDay, totalDays, percentage: totalDays > 0 ? Math.round((boundedDay / totalDays) * 100) : 0 };
}

export function getActiveCycle() {
  return prisma.cycle.findFirst({ where: { status: CycleStatus.ACTIVE }, orderBy: { startDate: "desc" } });
}
