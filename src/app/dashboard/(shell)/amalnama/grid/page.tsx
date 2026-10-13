import { TZDate } from "@date-fns/tz";
import { Gender, Role } from "@prisma/client";
import { addDays, format, subDays } from "date-fns";
import { bn } from "date-fns/locale";
import { ShieldAlert } from "lucide-react";

import {
  GRID_RANGE_OPTIONS,
  GridView,
  GridRangeChips,
  parseGridDays,
  weekdayShortLabels,
  type GridCell,
  type GridColumn,
  type GridRangeKey,
  type GridRow,
  type GridViewItem,
} from "@/components/amalnama/grid-view";
import { EmptyState, PageHeader } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { weekdayOrder } from "@/lib/constants";
import { filterVisibleItems } from "@/lib/amal-audience";
import { APP_TIME_ZONE, formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/** `?days=all` never renders more columns than this (most recent window kept). */
const MAX_ALL_DAYS = 120;

const bnNumber = new Intl.NumberFormat("bn-BD");
const toBn = (value: number) => bnNumber.format(Math.round(value * 100) / 100);

/** Entries are saved at Bangladesh midnight, so the UTC key is a stable day id. */
function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeLabelFor(range: GridRangeKey) {
  return GRID_RANGE_OPTIONS.find((option) => option.key === range)?.label ?? "৭ দিন";
}

export default async function AmalnamaGridPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; days?: string }>;
}) {
  const session = await requireUser();
  const role = session.user.role as Role;
  const isSupervisor = role === Role.ADMIN || role === Role.USTADH;

  const params = await searchParams;
  const range = parseGridDays(params.days);
  const requestedId = typeof params.member === "string" && /^[a-f\d]{24}$/i.test(params.member) ? params.member : null;
  // MEMBER → self only (any other id is ignored); ADMIN/USTADH → any member.
  const targetId = isSupervisor && requestedId ? requestedId : session.user.id;

  const member = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, role: true, gender: true, hideAmalnama: true, joinedAt: true },
  });
  if (!member) return <EmptyState title="সদস্য পাওয়া যায়নি" description="অন্য সদস্য বেছে আবার চেষ্টা করুন।" />;

  const isSelf = member.id === session.user.id;
  // A member can pass ?member=<id> — the target above was forced back to self,
  // so flag the request to explain why their own grid is shown instead.
  const blockedOther = !isSupervisor && !!requestedId && requestedId !== session.user.id;
  // Privacy: a hidden member shows the same neutral placeholder as the list
  // page — zero data is loaded or rendered for them.
  const hidden = isSupervisor && member.hideAmalnama;
  const rangeLabel = rangeLabelFor(range);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        eyebrow={`গ্রিড আমলনামা • ${rangeLabel}`}
        title="আমলনামা গ্রিড"
        description={`${member.name} (${member.role === Role.ADMIN ? "অ্যাডমিন" : member.role === Role.USTADH ? "উস্তায" : "সদস্য"}) — কাগজের ফরমের মতো একসাথে ১ দিন / ৭ দিন / ৩০ দিন / ৪০ দিনের আমল দেখুন।`}
        action={isSelf ? { label: "আজকের আমলনামা", href: "/dashboard/amalnama" } : { label: "আমলনামা তালিকা", href: "/dashboard/amalnama/list" }}
      />

      {blockedOther ? (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          আপনি শুধুমাত্র নিজের আমলনামা দেখতে পারবেন — অন্য সদস্যের আমলনামা দেখানো হয়নি।
        </div>
      ) : null}

      <GridRangeChips active={range} memberId={isSupervisor && !isSelf ? member.id : undefined} />

      {hidden ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950 px-4 py-3 text-white sm:px-5">
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400 text-sm font-bold text-emerald-950">
                {member.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{member.name}</p>
                <p className="truncate text-[11px] text-emerald-200">সদস্য</p>
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
      ) : (
        <GridData member={member} range={range} today={startOfBangladeshDay(getBangladeshToday())} isSelf={isSelf} />
      )}
    </div>
  );
}

/** Loads the window and builds the grid (kept separate to keep the page readable). */
async function GridData({
  member,
  range,
  today,
  isSelf,
}: {
  member: { id: string; name: string; role: string; gender: Gender; joinedAt: Date };
  range: GridRangeKey;
  today: Date;
  isSelf: boolean;
}) {
  const joinedAt = startOfBangladeshDay(member.joinedAt);
  const cappedStart = subDays(today, MAX_ALL_DAYS - 1);
  const requestedStart = range === "all" ? cappedStart : range === "1" ? today : subDays(today, Number(range) - 1);
  // Never render columns from before the member joined.
  const start = requestedStart.getTime() > joinedAt.getTime() ? requestedStart : joinedAt;
  const truncated = range === "all" && joinedAt.getTime() < cappedStart.getTime();

  const [allItems, entries] = await Promise.all([
    prisma.amalItem.findMany({ orderBy: { order: "asc" } }),
    prisma.dailyAmalEntry.findMany({ where: { userId: member.id, date: { gte: start, lte: today } }, orderBy: { date: "asc" } }),
  ]);

  // Audience: exactly the amals this member is scored on (ALL + own gender).
  const audienceItems = filterVisibleItems(allItems, member.gender);
  const respondedIds = new Set(entries.flatMap((entry) => entry.responses.map((response) => response.amalItemId)));
  const items = audienceItems.filter((item) => item.isActive || respondedIds.has(item.id));

  const entriesByDay = new Map(entries.map((entry) => [dayKey(entry.date), entry]));

  const columns: GridColumn[] = [];
  const cursor = new Date(start.getTime());
  while (cursor.getTime() <= today.getTime()) {
    const key = dayKey(cursor);
    const entry = entriesByDay.get(key);
    const zoned = new TZDate(cursor, APP_TIME_ZONE);
    columns.push({
      key,
      date: new Date(cursor.getTime()),
      dayNumber: toBn(zoned.getDate()),
      weekday: weekdayShortLabels[weekdayOrder[cursor.getDay()]],
      monthKey: format(zoned, "yyyy-MM", { locale: bn }),
      monthLabel: format(zoned, "MMMM yyyy", { locale: bn }),
      isPeriodDay: entry?.isPeriodDay ?? false,
      isToday: key === dayKey(today),
      isFuture: false,
      percent: null,
    });
    cursor.setTime(addDays(cursor, 1).getTime());
  }

  const dayStats = columns.map(() => ({ applicable: 0, done: 0 }));
  const missedByItem = new Map<string, number>();
  let noEntryCells = 0;

  const rows: GridRow[] = items.map((item) => {
    let missedCount = 0;
    let doneCount = 0;
    const cells = columns.map((column, index): GridCell => {
      const weekday = weekdayOrder[column.date.getDay()];
      // Weekly amal (e.g. শুক্রবার) on another weekday → neutral, never counted.
      if (item.specificDay && item.specificDay !== weekday) return { state: "offDay", display: "·" };

      const entry = entriesByDay.get(column.key);
      // Period (মাসিক) day: exempt amals show "—" and are never counted as missed.
      if (entry?.isPeriodDay && item.exemptOnPeriod) return { state: "exempt", display: "—" };

      // Applicable from here on: a day without any entry is "no data", not a miss.
      dayStats[index].applicable += 1;
      if (!entry) {
        noEntryCells += 1;
        return { state: "noEntry", display: "" };
      }

      const response = entry.responses.find((row) => row.amalItemId === item.id);
      if (!response) {
        missedCount += 1;
        return { state: "missed", display: "✗" };
      }
      const ratio = response.maxScore > 0 ? response.score / response.maxScore : 1;
      if (ratio >= 1) {
        doneCount += 1;
        dayStats[index].done += 1;
        return cellFor(item, response.valueNumber, "done");
      }
      if (response.score > 0) return cellFor(item, response.valueNumber, "partial");
      missedCount += 1;
      return { state: "missed", display: "✗" };
    });

    missedByItem.set(item.id, missedCount);
    return { item: item satisfies GridViewItem, cells, missedCount, doneCount } satisfies GridRow;
  });

  for (const [index, column] of columns.entries()) {
    const stats = dayStats[index];
    column.percent = stats.applicable > 0 ? Math.round((stats.done / stats.applicable) * 100) : null;
  }

  let completed = 0;
  let applicableAmalDays = 0;
  for (const stats of dayStats) {
    completed += stats.done;
    applicableAmalDays += stats.applicable;
  }
  const topMissed = items
    .filter((item) => (missedByItem.get(item.id) ?? 0) > 0)
    .sort((a, b) => (missedByItem.get(b.id) ?? 0) - (missedByItem.get(a.id) ?? 0))
    .slice(0, 5)
    .map((item) => ({ titleBn: item.titleBn, count: missedByItem.get(item.id) ?? 0 }));

  return (
    <GridView
      member={member}
      range={range}
      rangeLabel={rangeLabelFor(range)}
      windowLabel={`${formatBanglaDate(start)} – ${formatBanglaDate(today)}`}
      truncatedNote={truncated ? `সর্বশেষ ${toBn(MAX_ALL_DAYS)} দিন দেখানো হচ্ছে।` : null}
      columns={columns}
      rows={rows}
      summary={{
        dayCount: applicableAmalDays,
        completed,
        missed: rows.reduce((sum, row) => sum + row.missedCount, 0),
        noEntryCells,
        percent: applicableAmalDays > 0 ? Math.round((completed / applicableAmalDays) * 100) : 0,
        periodDays: columns.filter((column) => column.isPeriodDay).length,
        topMissed,
      }}
      commentsHref={isSelf ? null : "/dashboard/amalnama/list"}
      isSelf={isSelf}
    />
  );
}

/** ✓ for tick-style amals, the recorded value (Bengali digits + unit) for numeric ones. */
function cellFor(item: GridViewItem, valueNumber: number | null, state: "done" | "partial"): GridCell {
  if (item.inputType === "BOOLEAN" || item.inputType === "TEXT") return { state, display: "✓" };
  const value = valueNumber ?? 0;
  const unit = item.unit ? `\n${item.unit}` : "";
  return {
    state,
    display: `${toBn(value)}${unit}`,
    title: `${toBn(value)}${item.unit ? ` ${item.unit}` : ""}`,
  };
}
