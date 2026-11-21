import { CycleStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Amalnama is now written every day with no ৪০-দিনের মেয়াদ to set up.
 *
 * The database still stores each `DailyAmalEntry` (and `UstadhReview`) under a
 * `cycleId`, so we keep exactly one invisible "storage" cycle. Old entries stay
 * in whatever cycle they were written in — every report reads entries by
 * member + date, never by cycle.
 */
const STORAGE_TITLE = "দৈনিক আমলনামা";
const FAR_PAST = new Date("2020-01-01T00:00:00+06:00");
const FAR_FUTURE = new Date("2100-01-01T00:00:00+06:00");

/** Default window (days) for summary cards: the last 30 Bangladesh days. */
export const SUMMARY_WINDOW_DAYS = 30;

/**
 * The cycle new entries are stored under. Re-uses the latest ACTIVE cycle (so
 * today's existing entry keeps its row) and stretches it open-ended; creates one
 * the very first time.
 */
export async function getStorageCycle(creatorId: string) {
  const active = await prisma.cycle.findFirst({ where: { status: CycleStatus.ACTIVE }, orderBy: { startDate: "desc" } });
  if (active) {
    if (active.endDate.getTime() < FAR_FUTURE.getTime() || active.startDate.getTime() > FAR_PAST.getTime())
      return prisma.cycle.update({ where: { id: active.id }, data: { startDate: FAR_PAST, endDate: FAR_FUTURE } });
    return active;
  }
  return prisma.cycle.create({ data: { title: STORAGE_TITLE, startDate: FAR_PAST, endDate: FAR_FUTURE, status: CycleStatus.ACTIVE, createdById: creatorId } });
}

/** A member's entry for one Bangladesh day, whichever cycle it was stored in. */
export function findEntryForDay(userId: string, date: Date) {
  return prisma.dailyAmalEntry.findFirst({ where: { userId, date }, orderBy: { updatedAt: "desc" } });
}
