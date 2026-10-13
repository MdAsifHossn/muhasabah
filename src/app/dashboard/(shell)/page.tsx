import { DailyEntryStatus } from "@prisma/client";
import {
  BookMarked,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  Flame,
  Gauge,
  MessageCircleHeart,
  WifiOff,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/dashboard/common";
import { CardSection } from "@/components/design/card-section";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { StatTile } from "@/components/design/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveCycle, getCycleProgress } from "@/lib/cycles";
import { formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getTodayFastingInfo } from "@/lib/prayer-times";

/** Shortcuts that are NOT already in the mobile bottom bar. */
const quickActions = [
  { label: "আমলনামা", href: "/dashboard/amalnama", icon: ClipboardCheck },
  { label: "হাদীস", href: "/dashboard/hadith", icon: BookMarked },
  { label: "বই", href: "/dashboard/books", icon: BookOpen },
  { label: "রিভিউ", href: "/dashboard/reviews", icon: MessageCircleHeart },
];

export default async function DashboardPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();

  if (!cycle) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="মুহাসাবাহ"
          title={`আসসালামু আলাইকুম, ${session.user.name}`}
          description="আজকের আত্মসমালোচনা শুরু করতে সক্রিয় সাইকেলের অপেক্ষা করুন।"
        />
        <EmptyState
          icon={Gauge}
          title="কোনো সক্রিয় সাইকেল নেই"
          description="অ্যাডমিন নতুন সাইকেল চালু করলে এখানে আপনার দৈনিক আমলনামা দেখা যাবে।"
        />
      </div>
    );
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

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── Greeting + today's status ─────────────────────────────────── */}
      <PageHeader
        eyebrow={cycle.title}
        title={`আসসালামু আলাইকুম, ${session.user.name}`}
        description={`${formatBanglaDate(today)} • সাইকেলের ${progress.day}তম দিন`}
        meta={
          <>
            <StatusBadge tone={todayDone ? "green" : todayEntry ? "amber" : "neutral"}>
              {todayDone ? "আজকের আমল সম্পন্ন" : todayEntry ? "আজকের আমল খসড়ায় আছে" : "আজকের আমল শুরু হয়নি"}
            </StatusBadge>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 shadow-xs">
              <Gauge className="size-3.5 text-emerald-700" aria-hidden />
              {progress.percentage}% অগ্রগতি
            </span>
          </>
        }
      />

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <nav aria-label="দ্রুত কাজ" className="grid grid-cols-4 gap-2 sm:max-w-lg sm:gap-3">
        {quickActions.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="surface flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl px-1 py-2.5 text-center transition hover:border-hairline-strong hover:shadow-md active:scale-[0.97]"
          >
            <item.icon className="size-5 text-emerald-800" aria-hidden />
            <span className="text-[11px] font-bold leading-4 text-emerald-950">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* ── Numbers (2 columns on phones) ─────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          label="আজকের অবস্থা"
          value={todayDone ? "সম্পন্ন" : todayEntry ? "খসড়া" : "বাকি"}
          note="আজকের আমলনামা"
          icon={ClipboardCheck}
        />
        <StatTile
          label="সাইকেল অগ্রগতি"
          value={`${progress.percentage}%`}
          note={`${progress.day}/${progress.totalDays} দিন`}
          icon={Gauge}
          progress={progress.percentage}
        />
        <StatTile label="জমা দিয়েছেন" value={`${submittedEntries.length} দিন`} note="বর্তমান সাইকেলে" icon={CalendarCheck2} />
        <StatTile label="গড় স্কোর" value={`${average}%`} note="জমা দেওয়া দিনের গড়" icon={Flame} />
      </div>

      {/* ── Sahari & Iftar Banner ─────────────────────────────────────── */}
      <Card className="border-emerald-900/20 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-md">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">আজকের নামাজ ও সেহরি-ইফতার (ঢাকা অঞ্চল)</p>
            <h3 className="text-lg font-bold text-white sm:text-xl">সেহরি শেষ: {fasting.sahariEnd} • ইফতার: {fasting.iftar}</h3>
            <p className="text-xs leading-5 text-emerald-200">ফজর: {fasting.fajr} • যোহর: {fasting.dhuhr} • আসর: {fasting.asr} • ইশা: {fasting.isha}</p>
          </div>
          <Button asChild size="sm" className="bg-amber-400 text-emerald-950 hover:bg-amber-300 active:brightness-95 font-bold self-start sm:self-auto">
            <Link href="/dashboard/amalnama">নফল রোজা আমলনামায় যোগ করুন</Link>
          </Button>
        </CardContent>
      </Card>

      {/* ── Offline Quran reading entry ───────────────────────────────── */}
      <Card className="border-emerald-800/30 bg-emerald-50/70">
        <CardContent className="flex items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-950 text-amber-300">
            <WifiOff className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-emerald-950">পড়ার জন্য: অফলাইনে কুরআন পড়ুন</h3>
            <p className="mt-0.5 text-xs leading-5 text-stone-500">
              নেট থাকলে সূরা সেভ করে রাখুন — ইন্টারনেট ছাড়াই পরে পড়তে পারবেন।
            </p>
          </div>
          <Link
            href="/dashboard/offline"
            className="shrink-0 rounded-xl bg-emerald-950 px-3 py-2.5 text-xs font-bold text-white transition active:bg-emerald-900"
          >
            খুলুন →
          </Link>
        </CardContent>
      </Card>

      {/* ── Today's entry + latest ustad review ───────────────────────── */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <CardSection
          title="আজকের আমলনামা"
          action={<StatusBadge tone={todayDone ? "green" : todayEntry ? "amber" : "neutral"}>{todayDone ? "জমা হয়েছে" : todayEntry ? "খসড়া সংরক্ষিত" : "এখনও শুরু হয়নি"}</StatusBadge>}
        >
          <p className="text-sm leading-6 text-stone-500">
            নামাজ, কুরআন, নফল রোজা, সেহরি-ইফতার ও যিকর লিখে আজই সম্পন্ন করুন।
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/dashboard/amalnama">{todayDone ? "আজকের হিসাব দেখুন" : "আমলনামা পূরণ করুন"}</Link>
            </Button>
            <span className="text-xs font-medium text-stone-400">
              সাইকেলের {progress.day}/{progress.totalDays} দিন
            </span>
          </div>
        </CardSection>

        <CardSection title="সর্বশেষ উস্তাদজি রিভিউ">
          {latestReview ? (
            <div>
              <p className="text-sm leading-7 text-stone-600">{latestReview.comment}</p>
              <p className="mt-3 text-xs font-semibold text-emerald-700">— {latestReview.reviewer.name}</p>
              <Link className="mt-4 inline-block text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline" href="/dashboard/reviews">
                সব রিভিউ দেখুন
              </Link>
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-500">
              এখনও কোনো দৃশ্যমান রিভিউ দেওয়া হয়নি। নিয়মিত আমলনামা জমা দিন।
            </p>
          )}
        </CardSection>
      </div>
    </div>
  );
}
