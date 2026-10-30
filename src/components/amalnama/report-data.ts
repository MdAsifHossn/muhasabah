import type { AmalItem, DailyAmalEntry, Gender } from "@prisma/client";
import { addDays } from "date-fns";

import { applicableItems } from "@/lib/amal-rules";
import { bangladeshDateKey, getBangladeshWeekday, startOfBangladeshDay, type WeekdayName } from "@/lib/dates";

/**
 * Report engine shared by grid / list / history / progress / home.
 *
 * For every Bangladesh calendar day in a window it decides which amals were
 * applicable to the member (gender, weekday, period day — via applicableItems),
 * then classifies each applicable amal as done / partial / missed. Rules:
 * - an amal created after a day is not applicable on that day (adding a new
 *   Friday amal never back-fills "missed" into the past);
 * - an amal that is inactive now still counts on days the member answered it;
 * - a day with no entry at all is "noEntry" — a missed DAY, not missed amals;
 * - scores are recomputed from the applicable amals only, so stored rows for
 *   deleted items / another gender never inflate or deflate a day.
 */

export type ReportItem = Pick<
  AmalItem,
  "id" | "titleBn" | "category" | "inputType" | "targetValue" | "unit" | "points" | "genderScope" | "specificDay" | "exemptOnPeriod" | "isActive" | "createdAt"
>;

export type ReportEntry = Pick<DailyAmalEntry, "id" | "date" | "status" | "responses" | "isPeriodDay" | "personalNote">;

export type ItemOutcome = "done" | "partial" | "missed";

export type ReportDay = {
  key: string;
  date: Date;
  weekday: WeekdayName;
  entry: ReportEntry | null;
  isPeriodDay: boolean;
  /** Amals that applied on this day, in display order. */
  items: ReportItem[];
  outcomes: Map<string, { outcome: ItemOutcome; value: number | null }>;
  score: number;
  max: number;
  /** null when there is no entry for the day. */
  percent: number | null;
  done: number;
  partial: number;
  missed: number;
};

export type ReportSummary = {
  days: ReportDay[];
  totalDays: number;
  enteredDays: number;
  submittedDays: number;
  noEntryDays: number;
  periodDays: number;
  done: number;
  partial: number;
  missed: number;
  score: number;
  max: number;
  percent: number;
  streak: number;
  missedByItem: Map<string, number>;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

export function buildReport({
  items,
  entries,
  gender,
  start,
  end,
}: {
  items: ReportItem[];
  entries: ReportEntry[];
  gender: Gender | string | null | undefined;
  start: Date;
  end: Date;
}): ReportSummary {
  const entriesByDay = new Map(entries.map((entry) => [bangladeshDateKey(entry.date), entry]));
  const createdKey = new Map(items.map((item) => [item.id, bangladeshDateKey(item.createdAt)]));

  const days: ReportDay[] = [];
  const missedByItem = new Map<string, number>();
  const first = startOfBangladeshDay(start);
  const lastKey = bangladeshDateKey(end);

  for (let index = 0; index < 2000; index += 1) {
    const date = startOfBangladeshDay(addDays(first, index));
    const key = bangladeshDateKey(date);
    if (key > lastKey) break;
    const weekday = getBangladeshWeekday(date);
    const entry = entriesByDay.get(key) ?? null;
    const isPeriodDay = entry?.isPeriodDay ?? false;
    const answered = new Map((entry?.responses ?? []).map((response) => [response.amalItemId, response]));

    const dayItems = applicableItems(items, { gender, weekday, isPeriodDay }).filter(
      (item) => (createdKey.get(item.id) ?? "") <= key && (item.isActive || answered.has(item.id)),
    );

    const outcomes = new Map<string, { outcome: ItemOutcome; value: number | null }>();
    let score = 0;
    let max = 0;
    let done = 0;
    let partial = 0;
    let missed = 0;
    if (entry) {
      for (const item of dayItems) {
        const response = answered.get(item.id);
        max += item.points;
        const gained = response ? Math.min(response.score, item.points) : 0;
        score += gained;
        const ratio = item.points > 0 ? gained / item.points : response ? 1 : 0;
        const outcome: ItemOutcome = response && ratio >= 1 ? "done" : gained > 0 ? "partial" : "missed";
        if (outcome === "done") done += 1;
        else if (outcome === "partial") partial += 1;
        else {
          missed += 1;
          missedByItem.set(item.id, (missedByItem.get(item.id) ?? 0) + 1);
        }
        outcomes.set(item.id, { outcome, value: response?.valueNumber ?? null });
      }
    }

    days.push({
      key,
      date,
      weekday,
      entry,
      isPeriodDay,
      items: dayItems,
      outcomes,
      score: round2(score),
      max: round2(max),
      percent: entry ? (max > 0 ? Math.round((score / max) * 100) : 100) : null,
      done,
      partial,
      missed,
    });
  }

  const entered = days.filter((day) => day.entry);
  const submitted = entered.filter((day) => day.entry?.status !== "DRAFT");
  const score = entered.reduce((sum, day) => sum + day.score, 0);
  const max = entered.reduce((sum, day) => sum + day.max, 0);

  return {
    days,
    totalDays: days.length,
    enteredDays: entered.length,
    submittedDays: submitted.length,
    noEntryDays: days.length - entered.length,
    periodDays: days.filter((day) => day.isPeriodDay).length,
    done: entered.reduce((sum, day) => sum + day.done, 0),
    partial: entered.reduce((sum, day) => sum + day.partial, 0),
    missed: entered.reduce((sum, day) => sum + day.missed, 0),
    score: round2(score),
    max: round2(max),
    percent: max > 0 ? Math.round((score / max) * 100) : 0,
    streak: currentStreak(days),
    missedByItem,
  };
}

/** Consecutive days with an entry, ending today — today may still be pending. */
export function currentStreak(days: Pick<ReportDay, "entry">[]) {
  let index = days.length - 1;
  if (index >= 0 && !days[index].entry) index -= 1;
  let streak = 0;
  while (index >= 0 && days[index].entry) {
    streak += 1;
    index -= 1;
  }
  return streak;
}

/** The later of two dates — e.g. never report on days before the member joined. */
export function laterOf(a: Date, b: Date) {
  return a.getTime() > b.getTime() ? a : b;
}

export const reportItemSelect = {
  id: true,
  titleBn: true,
  category: true,
  inputType: true,
  targetValue: true,
  unit: true,
  points: true,
  genderScope: true,
  specificDay: true,
  exemptOnPeriod: true,
  isActive: true,
  createdAt: true,
} as const;

export const reportEntrySelect = { id: true, date: true, status: true, responses: true, isPeriodDay: true, personalNote: true } as const;

const bnNumber = new Intl.NumberFormat("bn-BD");
export const toBn = (value: number) => bnNumber.format(Math.round(value * 100) / 100);
