import type { Gender } from "@prisma/client";

import { buildReport, laterOf, reportEntrySelect, reportItemSelect, type ReportDay, type ReportItem } from "@/components/amalnama/report-data";
import { bangladeshDateKey, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

/**
 * "সেরা আমল" streak — how many days in a row a member caught every waqt's
 * prayer the best way:
 * - ভাই : পাঁচ ওয়াক্তেই জামাতের সাথে তাকবীরে উলা
 * - বোন : পাঁচ ওয়াক্তেই আউয়াল ওয়াক্তে আদায়
 *
 * A single missed waqt (or a past day with no entry) resets the count to 0.
 * Today does not break the streak while it is still being filled, and a
 * শরয়ী ওজরের দিন is neutral — it neither counts nor breaks.
 */
export type PrayerStreak = {
  /** Running streak, ending today/yesterday. */
  current: number;
  /** Longest streak ever recorded. */
  best: number;
  /** Today's waqts already marked done (0..total). */
  todayDone: number;
  todayTotal: number;
  /** Short label: "তাকবীরে উলা" / "আউয়াল ওয়াক্ত". */
  label: string;
  /** Last 14 days, oldest first: true = all waqts done, false = broken, null = neutral/pending. */
  recent: (boolean | null)[];
};

const TAKBIR = /তাকবীরে\s*উলা/;
const AWWAL = /আউয়াল\s*ওয়াক্ত/;

export function streakLabel(gender: Gender | string | null | undefined) {
  return gender === "FEMALE" ? "আউয়াল ওয়াক্ত" : "তাকবীরে উলা";
}

function isStreakItem(item: Pick<ReportItem, "titleBn" | "category">, gender: Gender | string | null | undefined) {
  if (item.category !== "SALAH") return false;
  return (gender === "FEMALE" ? AWWAL : TAKBIR).test(item.titleBn);
}

export function computePrayerStreak(days: ReportDay[], gender: Gender | string | null | undefined, todayKey: string): PrayerStreak | null {
  if (gender !== "MALE" && gender !== "FEMALE") return null;
  let run = 0;
  let best = 0;
  let todayDone = 0;
  let todayTotal = 0;
  let anyApplicable = false;
  const marks: (boolean | null)[] = [];

  for (const day of days) {
    const keyItems = day.items.filter((item) => isStreakItem(item, gender));
    const isToday = day.key === todayKey;
    if (keyItems.length === 0 || day.isPeriodDay) {
      marks.push(null);
      continue;
    }
    anyApplicable = true;
    const doneCount = day.entry ? keyItems.filter((item) => day.outcomes.get(item.id)?.outcome === "done").length : 0;
    const allDone = doneCount === keyItems.length;
    if (isToday) {
      todayDone = doneCount;
      todayTotal = keyItems.length;
      if (allDone) {
        run += 1;
        best = Math.max(best, run);
        marks.push(true);
      } else if (day.entry && doneCount < keyItems.length && day.entry.status !== "DRAFT") {
        // A submitted today that misses a waqt breaks the run right away.
        run = 0;
        marks.push(false);
      } else marks.push(null);
      continue;
    }
    if (allDone) {
      run += 1;
      best = Math.max(best, run);
      marks.push(true);
    } else {
      run = 0;
      marks.push(false);
    }
  }

  // No history yet → an empty streak to start from; history but no such amal → nothing to show.
  if (!anyApplicable && days.length > 0) return null;
  return { current: run, best, todayDone, todayTotal, label: streakLabel(gender), recent: marks.slice(-14) };
}

/** Loads a member's whole history and computes their prayer streak. */
export async function loadPrayerStreak(member: { id: string; gender: Gender | string; joinedAt: Date }) {
  const today = startOfBangladeshDay(getBangladeshToday());
  const first = await prisma.dailyAmalEntry.findFirst({ where: { userId: member.id }, orderBy: { date: "asc" }, select: { date: true } });
  if (!first) return computePrayerStreak([], member.gender, bangladeshDateKey(today));
  const from = laterOf(startOfBangladeshDay(first.date), startOfBangladeshDay(member.joinedAt));
  const [items, entries] = await Promise.all([
    prisma.amalItem.findMany({ orderBy: { order: "asc" }, select: reportItemSelect }),
    prisma.dailyAmalEntry.findMany({ where: { userId: member.id, date: { gte: from, lte: today } }, orderBy: { date: "asc" }, select: reportEntrySelect }),
  ]);
  const report = buildReport({ items, entries, gender: member.gender, start: from, end: today });
  return computePrayerStreak(report.days, member.gender, bangladeshDateKey(today));
}

/** Streaks for many members at once (Ustadh board) — one query per collection. */
export async function loadPrayerStreaks(members: { id: string; gender: Gender | string; joinedAt: Date }[]) {
  const result = new Map<string, PrayerStreak | null>();
  if (members.length === 0) return result;
  const today = startOfBangladeshDay(getBangladeshToday());
  const todayKey = bangladeshDateKey(today);
  const [items, entries] = await Promise.all([
    prisma.amalItem.findMany({ orderBy: { order: "asc" }, select: reportItemSelect }),
    prisma.dailyAmalEntry.findMany({
      where: { userId: { in: members.map((member) => member.id) }, date: { lte: today } },
      orderBy: { date: "asc" },
      select: { ...reportEntrySelect, userId: true },
    }),
  ]);
  const byUser = new Map<string, typeof entries>();
  for (const entry of entries) byUser.set(entry.userId, [...(byUser.get(entry.userId) ?? []), entry]);
  for (const member of members) {
    const own = byUser.get(member.id) ?? [];
    if (own.length === 0) {
      result.set(member.id, computePrayerStreak([], member.gender, todayKey));
      continue;
    }
    const from = laterOf(startOfBangladeshDay(own[0].date), startOfBangladeshDay(member.joinedAt));
    const report = buildReport({ items, entries: own, gender: member.gender, start: from, end: today });
    result.set(member.id, computePrayerStreak(report.days, member.gender, todayKey));
  }
  return result;
}
