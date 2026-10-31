import { CycleStatus } from "@prisma/client";
import { CalendarPlus, RefreshCcw } from "lucide-react";

import { ToastForm } from "@/components/dashboard/toast-form";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { changeCycleStatus, createCycle } from "@/lib/actions/admin";
import { cycleStatusLabels } from "@/lib/constants";
import { getCycleProgress } from "@/lib/cycles";
import { bangladeshDateKey, formatBanglaDate, getBangladeshToday } from "@/lib/dates";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "সাইকেল ব্যবস্থাপনা" };

const statusVariant = { ACTIVE: "soft", DRAFT: "warning", COMPLETED: "info", ARCHIVED: "secondary" } as const;
/** Which transitions make sense from each state. */
const nextStatuses: Record<CycleStatus, { status: CycleStatus; label: string; variant: "default" | "outline" | "ghost" }[]> = {
  DRAFT: [{ status: CycleStatus.ACTIVE, label: "সক্রিয় করুন", variant: "default" }, { status: CycleStatus.ARCHIVED, label: "আর্কাইভ", variant: "ghost" }],
  ACTIVE: [{ status: CycleStatus.COMPLETED, label: "সম্পন্ন করুন", variant: "outline" }],
  COMPLETED: [{ status: CycleStatus.ACTIVE, label: "আবার সক্রিয়", variant: "outline" }, { status: CycleStatus.ARCHIVED, label: "আর্কাইভ", variant: "ghost" }],
  ARCHIVED: [{ status: CycleStatus.DRAFT, label: "খসড়ায় ফেরান", variant: "ghost" }],
};

const n = (value: number) => value.toLocaleString("bn-BD");

export default async function AdminCyclesPage() {
  await requireAdmin();
  const cycles = await prisma.cycle.findMany({ orderBy: { startDate: "desc" }, include: { _count: { select: { entries: true, reviews: true } } } });
  const todayKey = bangladeshDateKey(getBangladeshToday());

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="উস্তাদ প্যানেল" title="সাইকেল ব্যবস্থাপনা" description="৭/৩০/৪০ দিনের মুহাসাবাহ সাইকেল তৈরি করুন। একসাথে একটিই সাইকেল সক্রিয় থাকে — নতুনটি সক্রিয় করলে আগেরটি সম্পন্ন হয়ে যায়।" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="order-2 space-y-3 lg:order-1">
          {cycles.length === 0 ? (
            <EmptyState icon={RefreshCcw} title="এখনও কোনো সাইকেল নেই" description="ডান পাশের ফর্ম থেকে প্রথম সাইকেল তৈরি করুন।" />
          ) : (
            cycles.map((cycle) => {
              const progress = getCycleProgress(cycle.startDate, cycle.endDate);
              return (
                <Card key={cycle.id} className={cycle.status === CycleStatus.ACTIVE ? "border-primary/40" : undefined}>
                  <CardContent>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-foreground">{cycle.title}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatBanglaDate(cycle.startDate)} — {formatBanglaDate(cycle.endDate)} • {n(progress.totalDays)} দিন
                        </p>
                      </div>
                      <Badge variant={statusVariant[cycle.status]}>{cycleStatusLabels[cycle.status]}</Badge>
                    </div>
                    {cycle.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{cycle.description}</p> : null}
                    {cycle.status === CycleStatus.ACTIVE ? (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {n(progress.day)}তম দিন / {n(progress.totalDays)}
                          </span>
                          <span>{n(progress.percentage)}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-sunken">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percentage}%` }} />
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-3">
                      <p className="text-xs text-subtle-foreground">
                        {n(cycle._count.entries)}টি দৈনিক এন্ট্রি • {n(cycle._count.reviews)}টি রিভিউ
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {nextStatuses[cycle.status].map((next) => (
                          <ToastForm key={next.status} action={changeCycleStatus} successMessage={`সাইকেল “${cycleStatusLabels[next.status]}” করা হয়েছে।`}>
                            <input type="hidden" name="cycleId" value={cycle.id} />
                            <input type="hidden" name="status" value={next.status} />
                            <Button size="sm" variant={next.variant}>
                              {next.label}
                            </Button>
                          </ToastForm>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </section>

        <Card className="order-1 h-fit lg:sticky lg:top-24 lg:order-2">
          <CardContent>
            <h2 className="flex items-center gap-2 font-bold text-foreground">
              <CalendarPlus className="size-4 text-primary" /> নতুন সাইকেল
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">তারিখগুলো বাংলাদেশ সময় অনুযায়ী ধরা হবে। তৈরির পর “সক্রিয় করুন” চাপলে সদস্যরা পূরণ শুরু করতে পারবেন।</p>
            <ToastForm action={createCycle} successMessage="নতুন সাইকেল খসড়া হিসেবে তৈরি হয়েছে।" className="mt-4 space-y-3">
              <Field label="সাইকেলের নাম" htmlFor="c-title">
                <Input id="c-title" name="title" required minLength={2} placeholder="যেমন: রমজান প্রস্তুতি — ৪০ দিন" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="শুরু" htmlFor="c-start">
                  <Input id="c-start" name="startDate" type="date" required defaultValue={todayKey} />
                </Field>
                <Field label="শেষ" htmlFor="c-end">
                  <Input id="c-end" name="endDate" type="date" required />
                </Field>
              </div>
              <Field label="বিবরণ (ঐচ্ছিক)" htmlFor="c-desc">
                <Textarea id="c-desc" name="description" className="min-h-20" />
              </Field>
              <Button className="w-full">সাইকেল তৈরি করুন</Button>
            </ToastForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
