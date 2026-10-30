import { Crown, Trophy } from "lucide-react";

import { toBn } from "@/components/amalnama/report-data";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Card } from "@/components/ui/card";
import { getElapsedCycleDays } from "@/lib/analytics";
import { getActiveCycle } from "@/lib/cycles";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateLeaderboard } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export const metadata = { title: "লিডারবোর্ড" };

const medal = ["bg-amber-400 text-amber-950", "bg-slate-300 text-slate-900", "bg-orange-300 text-orange-950"];

export default async function LeaderboardPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();
  if (!cycle) return <EmptyState icon={Trophy} title="লিডারবোর্ড প্রস্তুত নয়" description="সক্রিয় সাইকেল শুরু হলে র‍্যাংকিং দেখা যাবে।" />;

  // Members who hid their Amalnama never appear; only name + overall percent are shown.
  const users = await prisma.user.findMany({
    where: { isActive: true, hideAmalnama: false, role: "MEMBER" },
    select: { id: true, name: true, dailyEntries: { where: { cycleId: cycle.id }, select: { status: true, totalScore: true, maxPossibleScore: true } } },
  });
  const rows = calculateLeaderboard(
    users.map((user) => ({ userId: user.id, name: user.name, entries: user.dailyEntries })),
    getElapsedCycleDays(cycle.startDate, cycle.endDate),
  ).filter((row) => row.submittedDays > 0);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        eyebrow={cycle.title}
        title="লিডারবোর্ড"
        description="নিয়মিততা ও সম্পন্নতা মিলিয়ে সামগ্রিক স্কোর। কারো আমলের বিস্তারিত এখানে দেখানো হয় না — প্রতিযোগিতা নয়, পরস্পরকে উৎসাহ দেওয়াই উদ্দেশ্য।"
      />
      {rows.length === 0 ? (
        <EmptyState icon={Trophy} title="এখনো র‍্যাংকিং নেই" description="সদস্যরা আমলনামা জমা দিলে এখানে দেখা যাবে।" />
      ) : (
        <Card className="divide-y divide-hairline overflow-hidden">
          {rows.map((row) => {
            const self = row.userId === session.user.id;
            return (
              <div key={row.userId} className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", self && "bg-primary-soft")}>
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", medal[row.rank - 1] ?? "bg-surface-sunken text-muted-foreground")}>
                  {row.rank === 1 ? <Crown className="size-4" /> : toBn(row.rank)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {row.name} {self ? <span className="text-xs font-medium text-primary">(আপনি)</span> : null}
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${row.overallScore}%` }} />
                  </div>
                </div>
                <span className="w-12 text-right text-base font-bold tabular-nums text-foreground">{toBn(row.overallScore)}%</span>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
