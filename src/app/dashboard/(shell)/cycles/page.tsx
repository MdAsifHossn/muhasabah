import { differenceInCalendarDays } from "date-fns";
import { CalendarRange } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/common";
import { CardSection } from "@/components/design/card-section";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { cycleStatusLabels } from "@/lib/constants";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function CyclesPage() {
  const session = await requireUser();
  const cycles = await prisma.cycle.findMany({
    orderBy: { startDate: "desc" },
    include: { entries: { where: { userId: session.user.id } } },
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="মুহাসাবাহ"
        title="সাইকেলের হিসাব"
        description="প্রতিটি মুহাসাবাহ সাইকেলে আপনার ব্যক্তিগত participation ও average।"
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 shadow-xs">
            <CalendarRange className="size-3.5 text-emerald-700" aria-hidden />
            {cycles.length}টি সাইকেল
          </span>
        }
      />

      {cycles.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="কোনো সাইকেল নেই"
          description="অ্যাডমিন সাইকেল তৈরি করলে এখানে দেখা যাবে।"
        />
      ) : (
        <div className="space-y-4">
          {cycles.map((cycle) => {
            const submitted = cycle.entries.filter((entry) => entry.status !== "DRAFT");
            const average = submitted.length
              ? Math.round(submitted.reduce((sum, entry) => sum + entry.completionPercentage, 0) / submitted.length)
              : 0;
            const duration = differenceInCalendarDays(cycle.endDate, cycle.startDate) + 1;

            return (
              <CardSection
                key={cycle.id}
                title={cycle.title}
                description={`${cycle.startDate.toLocaleDateString("bn-BD")} — ${cycle.endDate.toLocaleDateString("bn-BD")} • ${duration} দিন`}
                action={
                  <StatusBadge tone={cycle.status === "ACTIVE" ? "green" : "neutral"}>
                    {cycleStatusLabels[cycle.status]}
                  </StatusBadge>
                }
              >
                <div className="grid grid-cols-2 gap-4 text-center sm:max-w-xs">
                  <div className="surface rounded-2xl px-3 py-3">
                    <p className="text-2xl font-bold text-emerald-900">{submitted.length}</p>
                    <p className="mt-0.5 text-xs text-stone-500">জমা</p>
                  </div>
                  <div className="surface rounded-2xl px-3 py-3">
                    <p className="text-2xl font-bold text-emerald-900">{average}%</p>
                    <p className="mt-0.5 text-xs text-stone-500">গড়</p>
                  </div>
                </div>
              </CardSection>
            );
          })}
        </div>
      )}
    </div>
  );
}
