import { CalendarCheck2, Flame, Gauge, TriangleAlert } from "lucide-react";

import { toBn } from "@/components/amalnama/report-data";
import { CardSection } from "@/components/design/card-section";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { StatTile } from "@/components/design/stat-tile";
import { loadMemberReport } from "@/lib/analytics";
import { categoryLabels } from "@/lib/constants";
import { getActiveCycle, getCycleProgress } from "@/lib/cycles";
import { getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "আমার অগ্রগতি" };

const weekdayShort: Record<string, string> = { SUNDAY: "র", MONDAY: "সো", TUESDAY: "ম", WEDNESDAY: "বু", THURSDAY: "বৃ", FRIDAY: "শু", SATURDAY: "শ" };

export default async function ProgressPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();
  if (!cycle) return <EmptyState icon={Gauge} title="কোনো সক্রিয় সাইকেল নেই" description="সাইকেল সক্রিয় হলে অগ্রগতি দেখা যাবে।" />;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, gender: true, joinedAt: true } });
  if (!user) return null;
  const today = startOfBangladeshDay(getBangladeshToday());
  const end = cycle.endDate.getTime() < today.getTime() ? startOfBangladeshDay(cycle.endDate) : today;
  const { report } = await loadMemberReport(user, cycle.startDate, end);
  const timeProgress = getCycleProgress(cycle.startDate, cycle.endDate);

  // Per-category completion over the days that have an entry.
  const categories = new Map<string, { done: number; total: number }>();
  const missedTitles = new Map<string, { title: string; count: number }>();
  for (const day of report.days) {
    if (!day.entry) continue;
    for (const item of day.items) {
      const bucket = categories.get(item.category) ?? { done: 0, total: 0 };
      bucket.total += 1;
      const outcome = day.outcomes.get(item.id)?.outcome;
      if (outcome === "done") bucket.done += 1;
      if (outcome === "missed") missedTitles.set(item.id, { title: item.titleBn, count: (missedTitles.get(item.id)?.count ?? 0) + 1 });
      categories.set(item.category, bucket);
    }
  }
  const recent = report.days.slice(-14);
  const topMissed = [...missedTitles.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow={cycle.title} title="আমার অগ্রগতি" description="ধারাবাহিকতা, গড় সম্পন্নতা আর কোন জায়গায় আরও মনোযোগ দরকার।" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="টানা ধারাবাহিকতা" value={`${toBn(report.streak)} দিন`} icon={Flame} tone="gold" />
        <StatTile label="জমা দেওয়া দিন" value={`${toBn(report.submittedDays)}/${toBn(report.totalDays)}`} icon={CalendarCheck2} />
        <StatTile label="এন্ট্রি নেই" value={`${toBn(report.noEntryDays)} দিন`} icon={TriangleAlert} tone="danger" />
        <StatTile label="গড় সম্পন্নতা" value={`${toBn(report.percent)}%`} icon={Gauge} tone="info" progress={report.percent} />
      </div>

      <CardSection title="সাইকেলের সময়" description={`${toBn(timeProgress.day)}তম দিন — মোট ${toBn(timeProgress.totalDays)} দিন`}>
        <div className="h-3 overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full rounded-full bg-primary" style={{ width: `${timeProgress.percentage}%` }} />
        </div>
        <p className="mt-2 text-right text-xs font-semibold text-muted-foreground">{toBn(timeProgress.percentage)}% সময় পার হয়েছে</p>
      </CardSection>

      <CardSection title="শেষ ১৪ দিন">
        <div className="flex h-40 items-end gap-1.5 sm:gap-2">
          {recent.map((day) => (
            <div key={day.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{day.percent === null ? "" : toBn(day.percent)}</span>
              <div
                className={cn(
                  "w-full rounded-t-md",
                  day.percent === null ? "bg-surface-sunken" : day.percent >= 80 ? "bg-success" : day.percent >= 40 ? "bg-warning" : "bg-danger",
                )}
                style={{ height: `${Math.max(day.percent ?? 0, 4)}%` }}
                title={day.key}
              />
              <span className={cn("text-[10px] font-semibold", day.weekday === "FRIDAY" ? "text-gold" : "text-subtle-foreground")}>{weekdayShort[day.weekday]}</span>
            </div>
          ))}
        </div>
      </CardSection>

      <div className="grid gap-5 lg:grid-cols-2">
        <CardSection title="বিভাগভিত্তিক সম্পন্নতা">
          {categories.size === 0 ? (
            <p className="text-sm text-muted-foreground">এখনো কোনো এন্ট্রি নেই।</p>
          ) : (
            <ul className="space-y-3">
              {[...categories.entries()].map(([category, bucket]) => {
                const percent = bucket.total ? Math.round((bucket.done / bucket.total) * 100) : 0;
                return (
                  <li key={category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{categoryLabels[category as keyof typeof categoryLabels] ?? category}</span>
                      <span className="font-bold tabular-nums text-muted-foreground">{toBn(percent)}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-sunken">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardSection>

        <CardSection title="যেগুলোতে আরও মনোযোগ দরকার">
          {topMissed.length === 0 ? (
            <p className="text-sm font-semibold text-success">মাশাআল্লাহ! এখন পর্যন্ত কোনো আমল মিস হয়নি।</p>
          ) : (
            <ul className="space-y-2">
              {topMissed.map((row) => (
                <li key={row.title} className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunken px-3 py-2.5 text-sm">
                  <span className="min-w-0 truncate text-foreground">{row.title}</span>
                  <span className="shrink-0 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">{toBn(row.count)} দিন</span>
                </li>
              ))}
            </ul>
          )}
        </CardSection>
      </div>
    </div>
  );
}
