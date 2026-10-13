import { TZDate } from "@date-fns/tz";
import { DailyEntryStatus, type DailyAmalEntry, type Role } from "@prisma/client";
import { differenceInCalendarDays, format, formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { LayoutGrid, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { CommentForm } from "@/components/amalnama/comment-form";
import { StatusBadge } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/constants";
import { APP_TIME_ZONE, formatBanglaDate, startOfBangladeshDay } from "@/lib/dates";

export type MemberComment = {
  id: string;
  comment: string;
  createdAt: Date;
  author: { name: string; role: Role };
};

export type MemberReportProps = {
  member: { id: string; name: string; role: Role; joinedAt: Date };
  /** Entries exactly as stored, newest first. */
  entries: DailyAmalEntry[];
  comments: MemberComment[];
  /** amalItemId → titleBn, already restricted to this member's audience. */
  itemTitles: Map<string, string>;
  /** Start of the selected range (null = সব সময়, falls back to joinedAt). */
  windowStart: Date | null;
  windowLabel: string;
  today: Date;
  canComment: boolean;
  /** Paper-style grid for this member (null → hidden Amalnama, no link). */
  gridHref?: string | null;
  /** The member hid their Amalnama → name + role only, zero data. */
  hiddenAmalnama?: boolean;
};

const MAX_DAY_ROWS = 90;

/** Entries are saved at Bangladesh midnight, so the UTC key is a stable day id. */
function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekdayBn(date: Date) {
  return format(new TZDate(date, APP_TIME_ZONE), "eeee", { locale: bn });
}

/** Consecutive days (ending today) that have an entry; today may still be pending. */
function computeStreak(entriesByDay: Map<string, DailyAmalEntry>, today: Date) {
  const cursor = new Date(today.getTime());
  if (!entriesByDay.has(dayKey(cursor))) cursor.setTime(cursor.getTime() - 86400000);
  let streak = 0;
  while (entriesByDay.has(dayKey(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - 86400000);
  }
  return streak;
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50 px-2 py-2.5 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-emerald-950">{value}</p>
    </div>
  );
}

export function MemberReport({
  member,
  entries,
  comments,
  itemTitles,
  windowStart,
  windowLabel,
  today,
  canComment,
  gridHref = null,
  hiddenAmalnama = false,
}: MemberReportProps) {
  // ── Privacy placeholder: roster stays complete, but nothing is leaked ──
  if (hiddenAmalnama) {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950 px-4 py-3 text-white sm:px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-sm font-bold text-emerald-950">
              {member.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{member.name}</p>
              <p className="truncate text-[11px] text-emerald-200">{roleLabels[member.role]}</p>
            </div>
          </div>
          <span className="inline-flex rounded-full border border-amber-400/50 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
            আমলনামা লুকানো হয়েছে
          </span>
        </div>
        <CardContent className="p-4 sm:p-5">
          <p className="text-xs leading-5 text-stone-500">
            সদস্যটি তার আমলনামা গোপন রেখেছেন — অ্যাডমিন ও উস্তাজি কোনো তথ্য দেখতে পারছেন না।
          </p>
        </CardContent>
      </Card>
    );
  }

  const entriesByDay = new Map(entries.map((entry) => [dayKey(entry.date), entry]));
  const start = windowStart ?? startOfBangladeshDay(member.joinedAt);
  const totalDays = Math.max(1, differenceInCalendarDays(today, start) + 1);

  // Totals over every response that belongs to this member's current audience.
  // Rows for deleted items (or for another audience after a gender change) are
  // dropped; on those days the score is recomputed from the surviving rows so
  // nobody is counted as having "missed" an amal that was never theirs.
  let doneCount = 0;
  let partialCount = 0;
  let missedCount = 0;
  let totalScore = 0;
  let totalMax = 0;
  for (const entry of entries) {
    const visible = entry.responses.filter((response) => itemTitles.has(response.amalItemId));
    const dropped = entry.responses.length - visible.length;
    for (const response of visible) {
      const ratio = response.maxScore > 0 ? response.score / response.maxScore : 1;
      if (ratio >= 1) doneCount += 1;
      else if (response.score > 0) partialCount += 1;
      else missedCount += 1;
    }
    if (dropped > 0) {
      totalScore += visible.reduce((sum, response) => sum + response.score, 0);
      totalMax += visible.reduce((sum, response) => sum + response.maxScore, 0);
    } else {
      totalScore += entry.totalScore;
      totalMax += entry.maxPossibleScore;
    }
  }

  const submittedDays = entries.length;
  const missedDays = Math.max(0, totalDays - submittedDays);
  const percent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  const streak = computeStreak(entriesByDay, today);

  // One row per day of the window (newest first), capped for very long ranges.
  const rows: Array<{ key: string; date: Date; entry?: DailyAmalEntry }> = [];
  const cursor = new Date(today.getTime());
  while (cursor.getTime() >= start.getTime() && rows.length < MAX_DAY_ROWS) {
    const key = dayKey(cursor);
    rows.push({ key, date: new Date(cursor.getTime()), entry: entriesByDay.get(key) });
    cursor.setTime(cursor.getTime() - 86400000);
  }
  const olderDays = cursor.getTime() >= start.getTime() ? Math.floor((cursor.getTime() - start.getTime()) / 86400000) + 1 : 0;

  return (
    <Card className="overflow-hidden">
      {/* ── Member header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950 px-4 py-3 text-white sm:px-5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-sm font-bold text-emerald-950">
            {member.name.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{member.name}</p>
            <p className="truncate text-[11px] text-emerald-200">
              {roleLabels[member.role]} • {windowLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {gridHref ? (
            <Link
              href={gridHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-400/25"
            >
              <LayoutGrid className="size-3.5" /> গ্রিড ভিউ
            </Link>
          ) : null}
          <StatusBadge tone={percent >= 80 ? "green" : percent >= 50 ? "amber" : "red"}>{percent}% সম্পন্ন</StatusBadge>
        </div>
      </div>

      <CardContent className="space-y-5 p-4 sm:p-5">
        {/* ── Summary ───────────────────────────────────────────── */}
        <div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SummaryStat label="জমা দিন" value={`${submittedDays} দিন`} />
            <SummaryStat label="বাদ দিন" value={`${missedDays} দিন`} />
            <SummaryStat label="টানা ধারাবাহিকতা" value={`${streak} দিন`} />
            <SummaryStat label="মোট পয়েন্ট" value={`${totalScore}/${totalMax}`} />
          </div>
          <p className="mt-2 text-xs text-stone-500">
            মোট আমল: <strong className="text-emerald-800">{doneCount} সম্পন্ন</strong>
            <span className="text-stone-300"> • </span>
            <strong className="text-amber-700">{partialCount} আংশিক</strong>
            <span className="text-stone-300"> • </span>
            <strong className="text-red-600">{missedCount} বাদ</strong>
          </p>
        </div>

        {/* ── Day by day ────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-400">দিনভিত্তিক হিসাব</h3>
            <span className="text-[11px] text-stone-400">সর্বশেষ {rows.length} দিন</span>
          </div>

          <div className="mt-2 space-y-2">
            {rows.map((row) => {
              if (!row.entry) {
                return (
                  <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50/60 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-700">
                        {formatBanglaDate(row.date)} <span className="font-medium text-stone-400">• {weekdayBn(row.date)}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-red-600">এই দিনের আমলনামা জমা দেওয়া হয়নি।</p>
                    </div>
                    <StatusBadge tone="red">বাদ</StatusBadge>
                  </div>
                );
              }

              const entry = row.entry;
              // Only amals inside the member's audience are named/counted here.
              const visibleResponses = entry.responses.filter((response) => itemTitles.has(response.amalItemId));
              const dropped = entry.responses.length - visibleResponses.length;
              const dayScore = dropped > 0 ? visibleResponses.reduce((sum, response) => sum + response.score, 0) : entry.totalScore;
              const dayMax = dropped > 0 ? visibleResponses.reduce((sum, response) => sum + response.maxScore, 0) : entry.maxPossibleScore;
              const dayPercent = dropped > 0
                ? dayMax > 0
                  ? Math.round((dayScore / dayMax) * 100)
                  : 0
                : entry.completionPercentage;
              const missedItems: string[] = [];
              const partialItems: string[] = [];
              for (const response of visibleResponses) {
                const title = itemTitles.get(response.amalItemId) ?? "আমল";
                const ratio = response.maxScore > 0 ? response.score / response.maxScore : 1;
                if (ratio >= 1) continue;
                if (response.score > 0) partialItems.push(title);
                else missedItems.push(title);
              }
              const tone = dayPercent >= 100 ? "green" : dayPercent > 0 ? "amber" : "red";

              return (
                <div key={row.key} className="rounded-xl border border-stone-100 bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 text-xs font-bold text-stone-700">
                      {formatBanglaDate(row.date)} <span className="font-medium text-stone-400">• {weekdayBn(row.date)}</span>
                      {entry.isPeriodDay ? (
                        <span className="ms-1.5 inline-flex items-center rounded-full border border-stone-200 bg-stone-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-stone-500">
                          মাসিক
                        </span>
                      ) : null}
                    </p>
                    <StatusBadge tone={tone}>
                      {dayPercent}%{entry.status === DailyEntryStatus.DRAFT ? " • খসড়া" : ""}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-[11px] text-stone-500">
                    স্কোর {dayScore}/{dayMax} • {visibleResponses.length}টি আমল রেকর্ড
                  </p>
                  {missedItems.length > 0 ? (
                    <p className="mt-1 text-[11px] font-semibold text-red-600">বাদ পড়েছে: {missedItems.join(", ")}</p>
                  ) : (
                    <p className="mt-1 text-[11px] font-semibold text-emerald-700">কোনো আমল বাদ পড়েনি।</p>
                  )}
                  {partialItems.length > 0 ? (
                    <p className="mt-0.5 text-[11px] font-semibold text-amber-700">আংশিক: {partialItems.join(", ")}</p>
                  ) : null}
                  {entry.personalNote ? (
                    <p className="mt-1 text-[11px] italic leading-5 text-stone-400">নোট: {entry.personalNote}</p>
                  ) : null}
                </div>
              );
            })}

            {olderDays > 0 ? (
              <p className="rounded-xl border border-dashed border-stone-200 px-3 py-2 text-center text-[11px] text-stone-400">
                আরও {olderDays} দিন এই রিপোর্টের বাইরে (সর্বশেষ {MAX_DAY_ROWS} দিন দেখানো হচ্ছে)।
              </p>
            ) : null}
          </div>
        </div>

        {/* ── Ustadh/Admin comments ─────────────────────────────── */}
        <div className="border-t border-stone-100 pt-4">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-stone-400">
            <MessageSquareText className="size-3.5" />
            উস্তাদের মন্তব্য ({comments.length})
          </h3>

          <div className="mt-2 space-y-2">
            {comments.length === 0 ? (
              <p className="text-xs text-stone-400">এখনো কোনো মন্তব্য দেওয়া হয়নি।</p>
            ) : (
              comments.map((item) => (
                <div key={item.id} className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-2.5">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{item.comment}</p>
                  <p className="mt-1.5 text-[11px] text-stone-400">
                    <span className="font-bold text-emerald-800">{item.author.name}</span> ({roleLabels[item.author.role]}) •{" "}
                    {formatBanglaDate(item.createdAt)} • {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: bn })}
                  </p>
                </div>
              ))
            )}
          </div>

          {canComment ? (
            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
              <CommentForm memberId={member.id} memberName={member.name} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
