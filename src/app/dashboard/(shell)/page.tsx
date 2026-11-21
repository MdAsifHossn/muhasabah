import { addDays } from "date-fns";
import { ArrowRight, BarChart3, BookMarked, BookOpenCheck, CalendarCheck2, CheckCircle2, ClipboardCheck, Flame, Gauge, LayoutGrid, Megaphone, MessageCircleHeart, UsersRound } from "lucide-react";
import Link from "next/link";

import { NoticeCard } from "@/components/amalnama/notice-card";
import { PrayerStreakCard } from "@/components/amalnama/prayer-streak-card";
import { toBn } from "@/components/amalnama/report-data";
import { StatTile } from "@/components/design/stat-tile";
import { TodayPrayerCard } from "@/components/today-prayer-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadMemberReport } from "@/lib/analytics";
import { SUMMARY_WINDOW_DAYS } from "@/lib/cycles";
import { loadPrayerStreak } from "@/lib/streaks";
import { bangladeshDateKey, formatBanglaDate, formatEnglishDate, formatHijriDate, getBangladeshToday, getBangladeshWeekday, startOfBangladeshDay } from "@/lib/dates";
import { getNoticesFor } from "@/lib/notices";
import { isStaffRole, requireUser } from "@/lib/permissions";
import { getTodayFastingInfo } from "@/lib/prayer-times";
import { prisma } from "@/lib/prisma";

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", hour12: false }).format(new Date()));
  if (hour < 5) return "শুভ রাত্রি";
  if (hour < 12) return "সুপ্রভাত";
  if (hour < 16) return "শুভ দুপুর";
  if (hour < 19) return "শুভ সন্ধ্যা";
  return "শুভ রাত্রি";
}

const quickLinks = [
  { label: "কুরআন পড়ুন", note: "যেখানে থেমেছিলেন", href: "/quran", icon: BookOpenCheck },
  { label: "হাদীস", note: "১০টি গ্রন্থ", href: "/dashboard/hadith", icon: BookMarked },
  { label: "আমার গ্রিড", note: "দিনভিত্তিক হিসাব", href: "/dashboard/amalnama/grid", icon: LayoutGrid },
  { label: "অগ্রগতি", note: "বিশ্লেষণ", href: "/dashboard/progress", icon: BarChart3 },
];

export default async function DashboardPage() {
  const session = await requireUser();
  const staff = isStaffRole(session.user.role);
  const today = startOfBangladeshDay(getBangladeshToday());
  const isFriday = getBangladeshWeekday(today) === "FRIDAY";

  const [user, timings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, gender: true, joinedAt: true } }),
    getTodayFastingInfo(),
  ]);
  if (!user) return null;

  const [notices, latestReview, windowData, streak] = await Promise.all([
    getNoticesFor({ role: session.user.role, gender: user.gender }, 3),
    prisma.ustadhReview.findFirst({ where: { memberId: user.id, isVisibleToMember: true }, orderBy: { updatedAt: "desc" }, include: { reviewer: { select: { name: true } } } }),
    loadMemberReport(user, startOfBangladeshDay(addDays(today, -(SUMMARY_WINDOW_DAYS - 1))), today),
    loadPrayerStreak(user),
  ]);

  const report = windowData.report;
  const lastDay = report?.days.at(-1);
  const todayDay = lastDay && lastDay.key === bangladeshDateKey(today) ? lastDay : null;
  const todayEntry = todayDay?.entry ?? null;
  const todaySubmitted = todayEntry && todayEntry.status !== "DRAFT";

  return (
    <div className="space-y-5">
      {/* ── Greeting + today ── */}
      {/* One banner: greeting, today's Amalnama and the তাকবীরে উলা / আউয়াল ওয়াক্ত streak side by side. */}
      <section className="hero-surface relative overflow-hidden rounded-card p-4 shadow-raised sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="text-xs text-on-hero-muted sm:text-sm">{greeting()} • {formatHijriDate(today)}</p>
            <h1 className="mt-0.5 truncate text-xl font-bold leading-tight sm:text-2xl">আসসালামু আলাইকুম, {session.user.name}</h1>
          </div>
          <p className="text-xs text-on-hero-muted sm:text-sm">
            {formatBanglaDate(today)}
            {isFriday ? " • আজ জুমার দিন — সূরা কাহাফ ও দরূদ" : ""}
          </p>
        </div>

        <div className={streak ? "mt-4 grid gap-3 lg:grid-cols-2" : "mt-4"}>
          <div className="flex flex-col justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <div className="flex items-center gap-3">
              <span className={todaySubmitted ? "grid size-11 shrink-0 place-items-center rounded-xl bg-teal-300 text-teal-950" : "grid size-11 shrink-0 place-items-center rounded-xl bg-marble-300 text-marble-950"}>
                {todaySubmitted ? <CheckCircle2 className="size-6" /> : <ClipboardCheck className="size-6" />}
              </span>
              <div className="min-w-0">
                <p className="font-bold leading-5">{todaySubmitted ? "আজকের আমলনামা জমা হয়েছে" : todayEntry ? "আজকের আমলনামা খসড়ায় আছে" : "আজকের আমলনামা বাকি"}</p>
                <p className="text-xs text-on-hero-muted">
                  প্রতিদিনের আমলনামা
                  {todayDay?.percent != null ? ` • আজ ${toBn(todayDay.percent)}%` : ""}
                </p>
              </div>
            </div>
            <Button asChild variant={todaySubmitted ? "hero" : "gold"} className="w-full">
              <Link href="/dashboard/amalnama">
                {todaySubmitted ? "দেখুন / সংশোধন" : "আমলনামা পূরণ করুন"} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {streak ? <PrayerStreakCard streak={streak} embedded /> : null}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="টানা জমা" value={`${toBn(report.streak)} দিন`} icon={Flame} tone="gold" />
        <StatTile label="গড় সম্পন্নতা" value={`${toBn(report.percent)}%`} note={`শেষ ${toBn(report.totalDays)} দিন`} icon={Gauge} progress={report.percent} />
        <StatTile label="জমা দেওয়া দিন" value={`${toBn(report.submittedDays)}/${toBn(report.totalDays)}`} note="শেষ ৩০ দিনে" icon={ClipboardCheck} tone="info" />
        <StatTile label="সম্পন্ন আমল" value={toBn(report.done)} note={`মিস ${toBn(report.missed)}টি`} icon={CalendarCheck2} />
      </div>

      {staff ? (
        <Link href="/dashboard/ustad" className="flex items-center gap-4 rounded-card border border-gold/40 bg-gold-soft p-4 transition hover:shadow-md">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold text-white dark:text-[#0b3b40]">
            <UsersRound className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gold-foreground">উস্তাদ প্যানেল</p>
            <p className="text-xs text-muted-foreground">সদস্যদের আজকের অবস্থা, মন্তব্য, রিভিউ ও নোটিশ</p>
          </div>
          <ArrowRight className="size-5 text-gold-foreground" />
        </Link>
      ) : null}

      <nav aria-label="দ্রুত লিংক" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map((item) => (
          <Link key={item.href} href={item.href} className="surface flex items-center gap-3 rounded-card p-3.5 transition hover:border-hairline-strong hover:shadow-md active:scale-[0.98]">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <item.icon className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-foreground">{item.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{item.note}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Megaphone className="size-4 text-primary" /> নোটিশ বোর্ড
            </h2>
            <Link href="/dashboard/notices" className="text-sm font-semibold text-primary">
              সব দেখুন
            </Link>
          </div>
          {notices.length === 0 ? (
            <p className="surface rounded-card px-4 py-6 text-center text-sm text-muted-foreground">এখনো কোনো নোটিশ নেই।</p>
          ) : (
            notices.map((notice) => <NoticeCard key={notice.id} notice={notice} compact />)
          )}
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <MessageCircleHeart className="size-4 text-primary" /> সর্বশেষ উস্তাদের রিভিউ
          </h2>
          <Card>
            <CardContent>
              {latestReview ? (
                <>
                  <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-7 text-foreground">{latestReview.comment}</p>
                  <p className="mt-3 text-xs font-semibold text-primary">— {latestReview.reviewer.name}</p>
                  <Link href="/dashboard/reviews" className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline">
                    সব রিভিউ
                  </Link>
                </>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">এখনো কোনো রিভিউ প্রকাশ হয়নি। নিয়মিত আমলনামা জমা দিতে থাকুন।</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <TodayPrayerCard timings={timings} hijriDate={formatHijriDate(today)} banglaDate={formatBanglaDate(today)} englishDate={formatEnglishDate(today)} compact />
    </div>
  );
}
