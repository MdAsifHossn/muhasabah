import { addDays } from "date-fns";
import { CalendarOff, LayoutGrid } from "lucide-react";
import Link from "next/link";

import { DailyForm, type DailyFormItem } from "@/components/amalnama/daily-form";
import { PeriodToggle } from "@/components/amalnama/period-toggle";
import { EmptyState } from "@/components/design/empty-state";
import { applicableItems } from "@/lib/amal-rules";
import { categoryLabels } from "@/lib/constants";
import { getActiveCycle, getCycleProgress, isDateInsideCycle } from "@/lib/cycles";
import { formatBanglaDate, formatHijriDate, getBangladeshToday, getBangladeshWeekday, startOfBangladeshDay, toBanglaDigits } from "@/lib/dates";
import { isStaffRole, requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "আজকের আমলনামা" };

const weekdayBn: Record<string, string> = {
  SUNDAY: "রবিবার",
  MONDAY: "সোমবার",
  TUESDAY: "মঙ্গলবার",
  WEDNESDAY: "বুধবার",
  THURSDAY: "বৃহস্পতিবার",
  FRIDAY: "শুক্রবার",
  SATURDAY: "শনিবার",
};

export default async function AmalnamaPage({ searchParams }: { searchParams: Promise<{ day?: string; member?: string; date?: string }> }) {
  const session = await requireUser();
  const params = await searchParams;
  const staffEditor = isStaffRole(session.user.role) && typeof params.member === "string" && /^[a-f\d]{24}$/i.test(params.member);
  const targetUserId = staffEditor ? params.member! : session.user.id;
  const day: "today" | "yesterday" = params.day === "yesterday" ? "yesterday" : "today";
  const dateKey = staffEditor && typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : null;
  const cycle = await getActiveCycle();
  if (!cycle) {
    return <EmptyState icon={CalendarOff} title="এখন কোনো সক্রিয় মেয়াদ নেই" description="নতুন মেয়াদ শুরু হলে প্রতিদিনের আমলনামা পূরণ করা যাবে।" />;
  }

  const today = startOfBangladeshDay(getBangladeshToday());
  const yesterday = startOfBangladeshDay(addDays(today, -1));
  const date = dateKey ? startOfBangladeshDay(new Date(`${dateKey}T00:00:00+06:00`)) : day === "yesterday" ? yesterday : today;
  const yesterdayAllowed = isDateInsideCycle(yesterday, cycle.startDate, cycle.endDate);
  const inCycle = isDateInsideCycle(date, cycle.startDate, cycle.endDate);
  const weekday = getBangladeshWeekday(date);
  const isFriday = weekday === "FRIDAY";
  const progress = getCycleProgress(cycle.startDate, cycle.endDate, date);

  const [viewer, allItems, entry] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, gender: true } }),
    prisma.amalItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    inCycle ? prisma.dailyAmalEntry.findUnique({ where: { userId_cycleId_date: { userId: targetUserId, cycleId: cycle.id, date } } }) : null,
  ]);
  if (!viewer) return <EmptyState title="সদস্যটি পাওয়া যায়নি" description="এই সদস্যের আমলনামা আর খুঁজে পাওয়া যাচ্ছে না।" />;
  const gender = viewer?.gender ?? "OTHER";
  const isFemale = gender === "FEMALE";
  const isPeriodDay = entry?.isPeriodDay ?? false;
  const items = applicableItems(allItems, { gender, weekday, isPeriodDay });
  const responses = new Map((entry?.responses ?? []).map((response) => [response.amalItemId, response]));
  const locked = entry?.status === "LOCKED" && !staffEditor;

  const formItems: DailyFormItem[] = items.map((item) => {
    const response = responses.get(item.id);
    return {
      id: item.id,
      titleBn: item.titleBn,
      description: item.description,
      categoryLabel: categoryLabels[item.category],
      category: item.category,
      inputType: item.inputType,
      targetValue: item.targetValue,
      unit: item.unit,
      points: item.points,
      genderScope: item.genderScope,
      isFridayOnly: item.specificDay === "FRIDAY",
      initial:
        item.inputType === "BOOLEAN"
          ? (response?.valueBoolean ?? false)
          : item.inputType === "TEXT"
            ? (response?.valueText ?? "")
            : (response?.valueNumber ?? 0),
    };
  });

  const meta = {
    title: staffEditor ? `${viewer.name}-এর ${dateKey ? formatBanglaDate(date) : day === "today" ? "আজকের" : "গতকালের"} আমলনামা` : day === "today" ? "আজকের আমলনামা" : "গতকালের আমলনামা",
    weekdayLabel: weekdayBn[weekday],
    banglaDate: formatBanglaDate(date),
    hijriDate: formatHijriDate(date),
    cycleLabel: `${toBanglaDigits(progress.day)}/${toBanglaDigits(progress.totalDays)} দিন`,
    isFriday,
    isExcused: isPeriodDay,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-6 lg:pb-8">
      {/* ── Day switch ── */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist" aria-label="দিন নির্বাচন">
        {(["today", "yesterday"] as const).map((option) => {
          const active = option === day;
          const disabled = option === "yesterday" && !yesterdayAllowed;
          const label = option === "today" ? "আজ" : "গতকাল";
          return disabled ? (
            <span key={option} className="grid h-10 place-items-center rounded-xl text-sm font-medium text-subtle-foreground opacity-60">
              {label}
            </span>
          ) : (
            <Link
              key={option}
              href={`/dashboard/amalnama?${new URLSearchParams({ ...(option === "yesterday" ? { day: "yesterday" } : {}), ...(staffEditor ? { member: targetUserId } : {}) }).toString()}`}
              role="tab"
              aria-selected={active}
              className={cn(
                "grid h-10 place-items-center rounded-xl text-sm font-semibold transition",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {!inCycle ? (
        <EmptyState icon={CalendarOff} title="এই দিনটি সক্রিয় মেয়াদের বাইরে" description="মেয়াদের নির্ধারিত দিনগুলোতেই আমলনামা পূরণ করা যায়।" />
      ) : formItems.length === 0 ? (
        <EmptyState title="এই দিনের জন্য কোনো আমল নেই" description="উস্তাদজি আমল যোগ করলে এখানে দেখা যাবে।" />
      ) : (
        <>
          {staffEditor ? <p className="rounded-2xl bg-warning-soft px-4 py-3 text-sm font-medium text-warning">উস্তাদজি মোড: এই সদস্যের আমলনামা সম্পাদনা, লক খোলা ও মুছে ফেলা যাবে।</p> : null}
          {locked ? <p className="rounded-2xl bg-info-soft px-4 py-3 text-sm font-medium text-info">এই দিনের আমলনামা লক করা — শুধু দেখা যাবে।</p> : null}
          <DailyForm
            key={`${day}-${entry?.updatedAt?.getTime() ?? 0}-${isPeriodDay}`}
            day={dateKey ? "today" : day}
            items={formItems}
            personalNote={entry?.personalNote ?? ""}
            status={entry?.status ?? null}
            locked={locked}
            meta={meta}
            memberId={staffEditor ? targetUserId : undefined}
            staffEditor={staffEditor}
            dateKey={dateKey ?? undefined}
            excuseSlot={isFemale && !dateKey ? <PeriodToggle key="excuse" isPeriod={isPeriodDay} day={day} disabled={locked} memberId={staffEditor ? targetUserId : undefined} /> : null}
          />
          <Link href={`/dashboard/amalnama/grid${staffEditor ? `?member=${targetUserId}` : ""}`} className="flex items-center justify-center gap-1.5 py-2 text-sm font-semibold text-primary">
            <LayoutGrid className="size-4" /> আগের দিনগুলোর হিসাব দেখুন
          </Link>
        </>
      )}
    </div>
  );
}
