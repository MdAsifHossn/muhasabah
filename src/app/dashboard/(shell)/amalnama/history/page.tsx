import { CalendarRange, LayoutGrid } from "lucide-react";
import Link from "next/link";

import { toBn } from "@/components/amalnama/report-data";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { loadMemberReport } from "@/lib/analytics";
import { getActiveCycle } from "@/lib/cycles";
import { formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "দিনভিত্তিক ইতিহাস" };

const weekdayBn: Record<string, string> = { SUNDAY: "রবি", MONDAY: "সোম", TUESDAY: "মঙ্গল", WEDNESDAY: "বুধ", THURSDAY: "বৃহস্পতি", FRIDAY: "শুক্র", SATURDAY: "শনি" };

export default async function AmalnamaHistoryPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();
  if (!cycle) return <EmptyState icon={CalendarRange} title="কোনো সক্রিয় সাইকেল নেই" description="সাইকেল চালু হলে আপনার দিনভিত্তিক ইতিহাস এখানে দেখা যাবে।" />;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, gender: true, joinedAt: true } });
  if (!user) return null;
  const today = startOfBangladeshDay(getBangladeshToday());
  const end = cycle.endDate.getTime() < today.getTime() ? startOfBangladeshDay(cycle.endDate) : today;
  const { report } = await loadMemberReport(user, cycle.startDate, end);
  const days = [...report.days].reverse();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={cycle.title}
        title="দিনভিত্তিক ইতিহাস"
        description="এই সাইকেলের প্রতিটি দিন — কত শতাংশ হয়েছে, কোন আমল মিস হয়েছে।"
        actions={
          <Button asChild variant="outline">
            <Link href="/dashboard/amalnama/grid?days=40">
              <LayoutGrid className="size-4" /> গ্রিড ভিউ
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <div className="surface rounded-card p-4 text-center">
          <p className="text-xs text-muted-foreground">গড়</p>
          <p className="mt-1 text-2xl font-bold text-primary">{toBn(report.percent)}%</p>
        </div>
        <div className="surface rounded-card p-4 text-center">
          <p className="text-xs text-muted-foreground">এন্ট্রি</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {toBn(report.enteredDays)}/{toBn(report.totalDays)}
          </p>
        </div>
        <div className="surface rounded-card p-4 text-center">
          <p className="text-xs text-muted-foreground">টানা</p>
          <p className="mt-1 text-2xl font-bold text-gold">{toBn(report.streak)} দিন</p>
        </div>
      </div>

      {days.length === 0 ? (
        <EmptyState title="এখনো কোনো দিন নেই" description="আজকের আমলনামা পূরণ করলে ইতিহাস এখানে দেখা যাবে।" />
      ) : (
        <ul className="space-y-2">
          {days.map((day) => {
            const missed = day.items.filter((item) => day.outcomes.get(item.id)?.outcome === "missed");
            return (
              <li key={day.key} className="surface rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <div className={cn("grid size-12 shrink-0 place-items-center rounded-xl text-center leading-tight", day.weekday === "FRIDAY" ? "bg-gold-soft text-gold-foreground" : "bg-surface-sunken text-foreground")}>
                    <span>
                      <span className="block text-base font-bold">{toBn(Number(day.key.slice(8)))}</span>
                      <span className="block text-[10px] font-semibold opacity-80">{weekdayBn[day.weekday]}</span>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{formatBanglaDate(day.date)}</p>
                      <div className="flex shrink-0 items-center gap-1">
                        {day.isPeriodDay ? <Badge variant="female">মাসিক</Badge> : null}
                        {day.entry ? (
                          <Badge variant={day.entry.status === "DRAFT" ? "secondary" : "soft"}>{day.entry.status === "DRAFT" ? "খসড়া" : "জমা"}</Badge>
                        ) : (
                          <Badge variant="danger">এন্ট্রি নেই</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <div className={cn("h-full rounded-full", (day.percent ?? 0) >= 80 ? "bg-success" : (day.percent ?? 0) >= 40 ? "bg-warning" : "bg-danger")} style={{ width: `${day.percent ?? 0}%` }} />
                      </div>
                      <span className="w-10 text-right text-xs font-bold tabular-nums text-foreground">{day.percent === null ? "—" : `${toBn(day.percent)}%`}</span>
                    </div>
                  </div>
                </div>
                {day.entry && missed.length > 0 ? (
                  <p className="mt-2 text-[11px] leading-5 text-danger">
                    <b>মিস:</b> {missed.map((item) => item.titleBn).join(", ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
