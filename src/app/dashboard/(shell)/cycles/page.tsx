import { CalendarRange } from "lucide-react";

import { toBn } from "@/components/amalnama/report-data";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getElapsedCycleDays } from "@/lib/analytics";
import { cycleStatusLabels } from "@/lib/constants";
import { formatBanglaDate, getCycleDayNumber } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "সাইকেলের হিসাব" };

export default async function CyclesPage() {
  const session = await requireUser();
  const cycles = await prisma.cycle.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: { startDate: "desc" },
    include: { entries: { where: { userId: session.user.id }, select: { status: true, totalScore: true, maxPossibleScore: true } } },
  });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="মুহাসাবাহ" title="সাইকেলের হিসাব" description="প্রতিটি মুহাসাবাহ সাইকেলে আপনার অংশগ্রহণ ও গড় সম্পন্নতা।" />
      {cycles.length === 0 ? (
        <EmptyState icon={CalendarRange} title="কোনো সাইকেল নেই" description="অ্যাডমিন সাইকেল চালু করলে এখানে দেখা যাবে।" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cycles.map((cycle) => {
            const submitted = cycle.entries.filter((entry) => entry.status !== "DRAFT");
            const score = submitted.reduce((sum, entry) => sum + entry.totalScore, 0);
            const max = submitted.reduce((sum, entry) => sum + entry.maxPossibleScore, 0);
            const average = max > 0 ? Math.round((score / max) * 100) : 0;
            const duration = getCycleDayNumber(cycle.startDate, cycle.endDate);
            const elapsed = getElapsedCycleDays(cycle.startDate, cycle.endDate);
            return (
              <Card key={cycle.id}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-bold text-foreground">{cycle.title}</h2>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatBanglaDate(cycle.startDate)} – {formatBanglaDate(cycle.endDate)} • {toBn(duration)} দিন
                      </p>
                    </div>
                    <Badge variant={cycle.status === "ACTIVE" ? "soft" : "secondary"}>{cycleStatusLabels[cycle.status]}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-surface-sunken py-3">
                      <p className="text-xl font-bold text-foreground">
                        {toBn(submitted.length)}
                        <span className="text-sm font-medium text-muted-foreground">/{toBn(elapsed)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">জমা দেওয়া দিন</p>
                    </div>
                    <div className="rounded-xl bg-primary-soft py-3">
                      <p className="text-xl font-bold text-primary">{toBn(average)}%</p>
                      <p className="text-xs text-muted-foreground">গড় সম্পন্নতা</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
