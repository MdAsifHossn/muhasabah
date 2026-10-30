import { TZDate } from "@date-fns/tz";
import { Role } from "@prisma/client";
import { format, subDays } from "date-fns";
import { bn } from "date-fns/locale";
import { ShieldAlert } from "lucide-react";

import {
  GRID_RANGE_OPTIONS,
  GridRangeChips,
  GridView,
  parseGridDays,
  weekdayShortLabels,
  type GridCell,
  type GridColumn,
  type GridRow,
} from "@/components/amalnama/grid-view";
import { HiddenAmalnamaCard } from "@/components/amalnama/member-report";
import { toBn, type ReportItem } from "@/components/amalnama/report-data";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Badge } from "@/components/ui/badge";
import { genderLabels } from "@/lib/amal-audience";
import { loadMemberReport } from "@/lib/analytics";
import { APP_TIME_ZONE, bangladeshDateKey, formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { isStaffRole, requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "আমলনামা গ্রিড" };

/** `?days=all` never renders more columns than this (most recent window kept). */
const MAX_ALL_DAYS = 120;

export default async function AmalnamaGridPage({ searchParams }: { searchParams: Promise<{ member?: string; days?: string }> }) {
  const session = await requireUser();
  const isSupervisor = isStaffRole(session.user.role);
  const params = await searchParams;
  const range = parseGridDays(params.days);
  const rangeLabel = GRID_RANGE_OPTIONS.find((option) => option.key === range)?.label ?? "৭ দিন";
  const requestedId = typeof params.member === "string" && /^[a-f\d]{24}$/i.test(params.member) ? params.member : null;
  // A member only ever sees themself; staff may open anyone via ?member=.
  const targetId = isSupervisor && requestedId ? requestedId : session.user.id;

  const member = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, name: true, role: true, gender: true, hideAmalnama: true, joinedAt: true },
  });
  if (!member) return <EmptyState title="সদস্য পাওয়া যায়নি" description="অন্য সদস্য বেছে আবার চেষ্টা করুন।" />;

  const isSelf = member.id === session.user.id;
  const blockedOther = !isSupervisor && !!requestedId && requestedId !== session.user.id;
  const hidden = !isSelf && member.hideAmalnama;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`আমলনামা রিপোর্ট • ${rangeLabel}`}
        title={isSelf ? "আমার আমলনামা গ্রিড" : `${member.name}-এর আমলনামা`}
        description="কাগজের আমলনামার মতো — প্রতিটি দিনে কোন আমল হয়েছে, কোনটি মিস হয়েছে একনজরে।"
        meta={
          <>
            <Badge variant={member.gender === "FEMALE" ? "female" : "soft"}>{genderLabels[member.gender]}</Badge>
            {member.role !== Role.MEMBER ? <Badge variant="gold">{member.role === Role.ADMIN ? "অ্যাডমিন" : "উস্তাদজি"}</Badge> : null}
          </>
        }
      />

      {blockedOther ? (
        <p className="flex items-start gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-xs font-semibold leading-5 text-warning">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          আপনি শুধুমাত্র নিজের আমলনামা দেখতে পারবেন — তাই আপনার নিজের গ্রিড দেখানো হচ্ছে।
        </p>
      ) : null}

      <GridRangeChips active={range} memberId={isSupervisor && !isSelf ? member.id : undefined} />

      {hidden ? <HiddenAmalnamaCard name={member.name} role={member.role} /> : <GridData member={member} range={range} rangeLabel={rangeLabel} isSelf={isSelf} />}
    </div>
  );
}

async function GridData({
  member,
  range,
  rangeLabel,
  isSelf,
}: {
  member: { id: string; name: string; gender: string; joinedAt: Date };
  range: ReturnType<typeof parseGridDays>;
  rangeLabel: string;
  isSelf: boolean;
}) {
  const today = startOfBangladeshDay(getBangladeshToday());
  const span = range === "all" ? MAX_ALL_DAYS : Number(range);
  const requestedStart = startOfBangladeshDay(subDays(today, span - 1));
  const joined = startOfBangladeshDay(member.joinedAt);
  const truncated = range === "all" && joined.getTime() < requestedStart.getTime();

  const { items, report } = await loadMemberReport(member, requestedStart, today);
  if (report.days.length === 0) return <EmptyState title="এই সময়ে কোনো দিন নেই" description="সদস্য যোগ দেওয়ার পরের দিনগুলো এখানে দেখা যাবে।" />;

  // Rows: every amal that applied on at least one day of the window, in catalogue order.
  const usedIds = new Set(report.days.flatMap((day) => day.items.map((item) => item.id)));
  const rowItems: ReportItem[] = items.filter((item) => usedIds.has(item.id));
  const todayKey = bangladeshDateKey(today);

  const columns: GridColumn[] = report.days.map((day) => {
    const zoned = new TZDate(day.date, APP_TIME_ZONE);
    return {
      key: day.key,
      dayNumber: toBn(zoned.getDate()),
      weekday: weekdayShortLabels[day.weekday],
      monthKey: format(zoned, "yyyy-MM"),
      monthLabel: format(zoned, "MMMM yyyy", { locale: bn }),
      fullLabel: format(zoned, "d MMMM yyyy, EEEE", { locale: bn }),
      isPeriodDay: day.isPeriodDay,
      isToday: day.key === todayKey,
      isFriday: day.weekday === "FRIDAY",
      hasEntry: Boolean(day.entry),
      percent: day.percent,
    };
  });

  const rows: GridRow[] = rowItems.map((item) => {
    let missedCount = 0;
    let doneCount = 0;
    const cells = report.days.map((day): GridCell => {
      const applies = day.items.some((candidate) => candidate.id === item.id);
      if (!applies) {
        // Explain why: a period day exemption reads "—", anything else is simply blank.
        return day.isPeriodDay && item.exemptOnPeriod ? { state: "exempt", display: "—" } : { state: "offDay", display: "" };
      }
      if (!day.entry) return { state: "noEntry", display: "·" };
      const result = day.outcomes.get(item.id);
      if (!result || result.outcome === "missed") {
        missedCount += 1;
        return { state: "missed", display: "✗" };
      }
      if (result.outcome === "done") doneCount += 1;
      if (item.inputType === "BOOLEAN" || item.inputType === "TEXT") return { state: result.outcome, display: "✓" };
      const value = result.value ?? 0;
      return { state: result.outcome, display: `${toBn(value)}${item.unit ? `\n${item.unit}` : ""}`, title: `${toBn(value)} ${item.unit ?? ""}` };
    });
    return { item, cells, missedCount, doneCount };
  });

  const topMissed = rowItems
    .map((item) => ({ titleBn: item.titleBn, count: report.missedByItem.get(item.id) ?? 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <GridView
      memberName={member.name}
      rangeLabel={rangeLabel}
      windowLabel={`${formatBanglaDate(report.days[0].date)} – ${formatBanglaDate(today)}`}
      truncatedNote={truncated ? `সর্বশেষ ${toBn(MAX_ALL_DAYS)} দিন দেখানো হচ্ছে।` : null}
      columns={columns}
      rows={rows}
      summary={{
        totalDays: report.totalDays,
        enteredDays: report.enteredDays,
        completed: report.done,
        missed: report.missed,
        noEntryDays: report.noEntryDays,
        percent: report.percent,
        periodDays: report.periodDays,
        topMissed,
      }}
      commentsHref={isSelf ? "/dashboard/amalnama/list" : `/dashboard/amalnama/list?member=${member.id}`}
      isSelf={isSelf}
    />
  );
}
