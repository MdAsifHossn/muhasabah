import { DailyEntryStatus } from "@prisma/client";
import { CalendarCheck2, ClipboardCheck, Flame, Gauge } from "lucide-react";
import Link from "next/link";

import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/common";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveCycle, getCycleProgress } from "@/lib/cycles";
import { formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getTodayFastingInfo } from "@/lib/prayer-times";

export default async function DashboardPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();

  if (!cycle) {
    return <div className="space-y-8"><PageHeader eyebrow="মুহাসাবাহ" title={`আসসালামু আলাইকুম, ${session.user.name}`} description="আজকের আত্মসমালোচনা শুরু করতে সক্রিয় সাইকেলের অপেক্ষা করুন。"/><EmptyState title="কোনো সক্রিয় সাইকেল নেই" description="অ্যাডমিন নতুন সাইকেল চালু করলে এখানে আপনার দৈনিক আমলনামা দেখা যাবে।"/></div>;
  }

  const today = startOfBangladeshDay(getBangladeshToday());
  const [todayEntry, submittedEntries, latestReview] = await Promise.all([
    prisma.dailyAmalEntry.findUnique({ where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date: today } } }),
    prisma.dailyAmalEntry.findMany({ where: { userId: session.user.id, cycleId: cycle.id, status: { in: [DailyEntryStatus.SUBMITTED, DailyEntryStatus.LOCKED] } }, orderBy: { date: "desc" } }),
    prisma.ustadhReview.findFirst({ where: { memberId: session.user.id, cycleId: cycle.id, isVisibleToMember: true }, orderBy: { updatedAt: "desc" }, include: { reviewer: { select: { name: true } } } }),
  ]);
  const progress = getCycleProgress(cycle.startDate, cycle.endDate, today);
  const average = submittedEntries.length ? Math.round(submittedEntries.reduce((sum, entry) => sum + entry.completionPercentage, 0) / submittedEntries.length) : 0;
  const todayDone = todayEntry?.status === DailyEntryStatus.SUBMITTED || todayEntry?.status === DailyEntryStatus.LOCKED;
  const fasting = await getTodayFastingInfo();

  return <div className="space-y-8">
    <PageHeader eyebrow={cycle.title} title={`আসসালামু আলাইকুম, ${session.user.name}`} description={`${formatBanglaDate(today)} • সাইকেলের ${progress.day}তম দিন`}/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="আজকের অবস্থা" value={todayDone ? "সম্পন্ন" : todayEntry ? "খসড়া" : "বাকি"} note="আজকের আমলনামা" icon={ClipboardCheck}/>
      <StatCard label="সাইকেল অগ্রগতি" value={`${progress.percentage}%`} note={`${progress.day}/${progress.totalDays} দিন`} icon={Gauge}/>
      <StatCard label="জমা দিয়েছেন" value={`${submittedEntries.length} দিন`} note="বর্তমান সাইকেলে" icon={CalendarCheck2}/>
      <StatCard label="গড় স্কোর" value={`${average}%`} note="জমা দেওয়া দিনের গড়" icon={Flame}/>
    </div>

    {/* Sahari & Iftar Banner */}
    <Card className="border-emerald-900/20 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-md">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">আজকের নামাজ ও সেহরি-ইফতার (ঢাকা অঞ্চল)</p>
          <h3 className="text-xl font-bold text-white">সেহরি শেষ: {fasting.sahariEnd} • ইফতার: {fasting.iftar}</h3>
          <p className="text-xs text-emerald-200">ফজর: {fasting.fajr} • যোহর: {fasting.dhuhr} • আসর: {fasting.asr} • ইশা: {fasting.isha}</p>
        </div>
        <Button asChild size="sm" className="bg-amber-400 text-emerald-950 hover:bg-amber-300 font-bold self-start sm:self-auto">
          <Link href="/dashboard/amalnama">নফল রোজা আমলনামায় যোগ করুন</Link>
        </Button>
      </CardContent>
    </Card>

    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <Card><CardContent><h2 className="mb-5 text-lg font-bold text-emerald-950">আজকের আমলনামা</h2><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><StatusBadge tone={todayDone ? "green" : todayEntry ? "amber" : "neutral"}>{todayDone ? "জমা হয়েছে" : todayEntry ? "খসড়া সংরক্ষিত" : "এখনও শুরু হয়নি"}</StatusBadge><p className="mt-3 text-sm leading-6 text-stone-500">নামাজ, কুরআন, নফল রোজা, সেহরি-ইফতার ও যিকর লিখে আজই সম্পন্ন করুন।</p></div><Button asChild><Link href="/dashboard/amalnama">{todayDone ? "আজকের হিসাব দেখুন" : "আমলনামা পূরণ করুন"}</Link></Button></div></CardContent></Card>
      <Card><CardContent><h2 className="mb-5 text-lg font-bold text-emerald-950">সর্বশেষ উস্তাদজি রিভিউ</h2>{latestReview ? <div><p className="text-sm leading-7 text-stone-600">{latestReview.comment}</p><p className="mt-3 text-xs font-semibold text-emerald-700">— {latestReview.reviewer.name}</p><Link className="mt-4 inline-block text-sm font-semibold text-emerald-700" href="/dashboard/reviews">সব রিভিউ দেখুন</Link></div> : <p className="text-sm leading-6 text-stone-500">এখনও কোনো দৃশ্যমান রিভিউ দেওয়া হয়নি। নিয়মিত আমলনামা জমা দিন।</p>}</CardContent></Card>
    </div>
  </div>;
}