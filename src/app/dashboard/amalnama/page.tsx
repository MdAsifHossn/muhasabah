import { AmalCategory, AmalInputType, DailyEntryStatus } from "@prisma/client";
import { CheckCircle2, Save, Sparkles, Award, Check } from "lucide-react";
import Link from "next/link";

import { EmptyState, PageHeader, StatusBadge, inputClass, textareaClass } from "@/components/dashboard/common";
import { ToastForm } from "@/components/dashboard/toast-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { saveDailyAmalnama } from "@/lib/actions/amalnama";
import { categoryLabels, weekdayOrder } from "@/lib/constants";
import { getActiveCycle, getCycleProgress, isDateInsideCycle } from "@/lib/cycles";
import { formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AmalnamaPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();

  if (!cycle)
    return (
      <EmptyState
        title="বর্তমানে কোনো সক্রিয় মুহাসাবাহ সাইকেল নেই।"
        description="অ্যাডমিন নতুন সাইকেল সক্রিয় করলে দৈনিক আমলনামা পূরণ করা যাবে।"
      />
    );

  const today = startOfBangladeshDay(getBangladeshToday());
  if (!isDateInsideCycle(today, cycle.startDate, cycle.endDate))
    return (
      <EmptyState
        title="আজকের দিনটি সক্রিয় সাইকেলের বাইরে।"
        description="সাইকেলের নির্ধারিত সময়ের মধ্যে আমলনামা পূরণ করা যাবে।"
      />
    );

  const day = weekdayOrder[new Date(today).getDay()];
  const allItems = await prisma.amalItem.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  const items = allItems.filter((item) => !item.specificDay || item.specificDay === day);
  const entry = await prisma.dailyAmalEntry.findUnique({
    where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date: today } },
  });
  const progress = getCycleProgress(cycle.startDate, cycle.endDate, today);
  const responses = new Map((entry?.responses ?? []).map((response) => [response.amalItemId, response]));

  const grouped = items.reduce((groups, item) => {
    const current = groups.get(item.category) ?? [];
    current.push(item);
    groups.set(item.category, current);
    return groups;
  }, new Map<AmalCategory, typeof items>());

  const isSubmitted = entry?.status === DailyEntryStatus.SUBMITTED || entry?.status === DailyEntryStatus.LOCKED;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Top Banner Header */}
      <PageHeader
        eyebrow={`${cycle.title} • ${progress.day}তম দিন / ${progress.totalDays} দিন`}
        title="আজকের দৈনন্দিন আমলনামা"
        description={`${formatBanglaDate(today)} — নামাজ, কুরআন, রোজা ও যিকিরের মাধ্যমে প্রতিদিনের আত্মপর্যালোচনা করুন।`}
        action={{ label: "পূর্বের ইতিহাস", href: "/dashboard/amalnama/history" }}
      />

      {/* Submission Status Alert Card */}
      {entry ? (
        <Card className="border-emerald-700/40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-lg">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-amber-400 text-emerald-950 font-bold">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={isSubmitted ? "green" : "amber"}>
                    {isSubmitted ? "জমা সম্পন্ন হয়েছে" : "খসড়া সংরক্ষিত"}
                  </StatusBadge>
                  <span className="text-xs text-emerald-200">
                    আজকের স্কোর: <strong className="text-amber-300 font-bold text-sm">{entry.completionPercentage}%</strong>
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-200/90">
                  {isSubmitted
                    ? "আপনি আজকের হিসাব সফলভাবে জমা দিয়েছেন। যে কোনো সময় তথ্য আপডেট করতে পারবেন।"
                    : "আপনার এন্ট্রিটি খসড়া হিসেবে সংরক্ষিত রয়েছে। চূডা়ন্ত জমা দিন।"}
                </p>
              </div>
            </div>

            <Button asChild size="sm" variant="outline" className="border-amber-400/50 bg-amber-400/10 text-amber-300 hover:bg-amber-400 hover:text-emerald-950 font-bold self-start sm:self-auto">
              <Link href="/dashboard/progress">অগ্রগতি স্কোর দেখুন</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Main Amal Form */}
      <ToastForm action={saveDailyAmalnama} className="space-y-6">
        {Array.from(grouped.entries()).map(([category, categoryItems]) => (
          <Card key={category} className="overflow-hidden border-stone-200/90 shadow-md">
            <div className="border-b border-stone-100 bg-emerald-950 px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="size-4 text-amber-400" />
                {categoryLabels[category]}
              </h2>
              <span className="text-xs text-emerald-300 font-semibold bg-emerald-900 px-3 py-1 rounded-full border border-emerald-800">
                {categoryItems.length}টি আমল
              </span>
            </div>

            <CardContent className="divide-y divide-stone-100 p-6">
              {categoryItems.map((item) => {
                const response = responses.get(item.id);
                const fieldName = `item_${item.id}`;

                if (item.inputType === AmalInputType.BOOLEAN) {
                  return (
                    <label
                      key={item.id}
                      className="group flex cursor-pointer items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 hover:bg-emerald-50/50 -mx-3 px-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <input
                          type="checkbox"
                          name={fieldName}
                          defaultChecked={response?.valueBoolean ?? false}
                          className="size-5 rounded border-stone-300 text-emerald-800 accent-emerald-800 focus:ring-emerald-700"
                        />
                        <span className="text-sm font-semibold text-stone-800 group-hover:text-emerald-950">
                          {item.titleBn}
                        </span>
                      </div>
                      <span className="rounded-full bg-amber-100/80 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200">
                        +{item.points} পয়েন্ট
                      </span>
                    </label>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_180px] sm:items-center"
                  >
                    <div>
                      <label htmlFor={fieldName} className="text-sm font-semibold text-stone-800">
                        {item.titleBn}
                      </label>
                      {item.targetValue ? (
                        <p className="mt-0.5 text-xs font-medium text-stone-500">
                          নির্ধারিত লক্ষ্য: <strong className="text-emerald-900">{item.targetValue} {item.unit}</strong> (+{item.points} পয়েন্ট)
                        </p>
                      ) : (
                        <span className="mt-0.5 inline-block text-xs font-medium text-emerald-800">
                          +{item.points} পয়েন্ট
                        </span>
                      )}
                    </div>

                    {item.inputType === AmalInputType.TEXT ? (
                      <textarea
                        id={fieldName}
                        name={fieldName}
                        defaultValue={response?.valueText ?? ""}
                        className={`${textareaClass} text-xs`}
                        placeholder="সংক্ষিপ্ত বিবরণ লিখুন..."
                      />
                    ) : (
                      <div className="relative">
                        <input
                          id={fieldName}
                          name={fieldName}
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={response?.valueNumber ?? 0}
                          className={`${inputClass} font-bold text-emerald-950`}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-stone-400">
                          {item.unit}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}

        {/* Personal Reflection Section */}
        <Card className="border-stone-200 shadow-md">
          <CardContent className="p-6 space-y-3">
            <label htmlFor="personalNote" className="text-lg font-bold text-emerald-950 block">
              ব্যক্তিগত আত্মপর্যালোচনা ও সংকল্প
            </label>
            <p className="text-xs text-stone-500">
              আজকের দিনে কোনো বিশেষ ত্রুটি সংশোধন বা সংকল্প থাকলে তা এখানে লিখে রাখতে পারেন।
            </p>
            <textarea
              id="personalNote"
              name="personalNote"
              defaultValue={entry?.personalNote ?? ""}
              className={`${textareaClass} mt-2 text-sm leading-relaxed`}
              placeholder="আজকের দিন সম্পর্কে আপনার সংক্ষিপ্ত ভাবনা বা আত্মপর্যালোচনা..."
            />
          </CardContent>
        </Card>

        {/* Floating Submit Bar */}
        <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-emerald-900/20 bg-emerald-950/95 p-4 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between text-white">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-200">
            <Award className="size-4 text-amber-400" />
            <span>সঠিক ও নিয়মিত আমল জমা দিয়ে আপনার মুহাসাবাহ স্কোর বাড়ান</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              name="intent"
              value="draft"
              variant="outline"
              className="border-emerald-700 bg-emerald-900/60 text-white hover:bg-emerald-800 font-semibold text-xs"
            >
              <Save className="mr-1.5 size-4 text-amber-300" /> খসড়া রাখুন
            </Button>

            <Button
              type="submit"
              name="intent"
              value="submit"
              className="bg-amber-400 font-extrabold text-emerald-950 hover:bg-amber-300 shadow-lg text-sm px-6"
            >
              <Check className="mr-1.5 size-4 stroke-[3]" /> আজ জমা দিন
            </Button>
          </div>
        </div>
      </ToastForm>
    </div>
  );
}