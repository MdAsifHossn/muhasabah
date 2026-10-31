import { ArrowRight, BarChart3, BookMarked, BookOpenCheck, CalendarOff, CheckCircle2, ClipboardCheck, Flame, Gauge, LayoutGrid, Megaphone, MessageCircleHeart, UsersRound } from "lucide-react";
import Link from "next/link";

import { NoticeCard } from "@/components/amalnama/notice-card";
import { toBn } from "@/components/amalnama/report-data";
import { EmptyState } from "@/components/design/empty-state";
import { StatTile } from "@/components/design/stat-tile";
import { TodayPrayerCard } from "@/components/today-prayer-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadMemberReport } from "@/lib/analytics";
import { getActiveCycle, getCycleProgress } from "@/lib/cycles";
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
  { label: "আমার গ্রিড", note: "৭/৩০/৪০ দিন", href: "/dashboard/amalnama/grid", icon: LayoutGrid },
  { label: "অগ্রগতি", note: "বিশ্লেষণ", href: "/dashboard/progress", icon: BarChart3 },
];

export default async function DashboardPage() {
  const session = await requireUser();
  const staff = isStaffRole(session.user.role);
  const today = startOfBangladeshDay(getBangladeshToday());
  const isFriday = getBangladeshWeekday(today) === "FRIDAY";

  const [cycle, user, timings] = await Promise.all([
    getActiveCycle(),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, gender: true, joinedAt: true } }),
    getTodayFastingInfo(),
  ]);
  if (!user) return null;

  const [notices, latestReview, cycleData] = await Promise.all([
    getNoticesFor({ role: session.user.role, gender: user.gender }, 3),
    prisma.ustadhReview.findFirst({ where: { memberId: user.id, isVisibleToMember: true }, orderBy: { updatedAt: "desc" }, include: { reviewer: { select: { name: true } } } }),
    cycle ? loadMemberReport(user, cycle.startDate, cycle.endDate.getTime() < today.getTime() ? startOfBangladeshDay(cycle.endDate) : today) : null,
  ]);

  const report = cycleData?.report ?? null;
  const lastDay = report?.days.at(-1);
  const todayDay = lastDay && lastDay.key === bangladeshDateKey(today) ? lastDay : null;
  const todayEntry = todayDay?.entry ?? null;
  const todaySubmitted = todayEntry && todayEntry.status !== "DRAFT";
  const progress = cycle ? getCycleProgress(cycle.startDate, cycle.endDate) : null;

  return (
    <div className="space-y-5">
      {/* ── Greeting + today ── */}
      <section className="hero-surface relative overflow-hidden rounded-card p-5 shadow-raised sm:p-7">
        <p className="text-sm text-on-hero-muted">
          {greeting()} • {formatHijriDate(today)}
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-tight sm:text-3xl">আসসালামু আলাইকুম, {session.user.name}</h1>
        <p className="mt-1 text-sm text-on-hero-muted">
          {formatBanglaDate(today)}
          {isFriday ? " • আজ জুমার দিন — সূরা কাহাফ ও বেশি বেশি দরূদ ভুলবেন না" : ""}
        </p>

        {cycle && progress ? (
          <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className={todaySubmitted ? "grid size-11 place-items-center rounded-xl bg-emerald-300 text-emerald-950" : "grid size-11 place-items-center rounded-xl bg-amber-300 text-amber-950"}>
                {todaySubmitted ? <CheckCircle2 className="size-6" /> : <ClipboardCheck className="size-6" />}
              </span>
              <div>
                <p className="font-bold">{todaySubmitted ? "আজকের আমলনামা জমা হয়েছে" : todayEntry ? "আজকের আমলনামা খসড়ায় আছে" : "আজকের আমলনামা বাকি"}</p>
                <p className="text-xs text-on-hero-muted">
                  {cycle.title} • {toBn(progress.day)}/{toBn(progress.totalDays)} দিন
                  {todayDay?.percent != null ? ` • আজ ${toBn(todayDay.percent)}%` : ""}
                </p>
              </div>
            </div>
            <Button asChild variant={todaySubmitted ? "hero" : "gold"} className="w-full sm:w-auto">
              <Link href="/dashboard/amalnama">
                {todaySubmitted ? "দেখুন / সংশোধন" : "আমলনামা পূরণ করুন"} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </section>

      {!cycle || !report ? (
        <EmptyState icon={CalendarOff} title="কোনো সক্রিয় সাইকেল নেই" description="উস্তাদজি নতুন সাইকেল চালু করলে এখানে আপনার আমলনামার হিসাব দেখা যাবে।" />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="টানা ধারাবাহিকতা" value={`${toBn(report.streak)} দিন`} icon={Flame} tone="gold" />
          <StatTile label="গড় সম্পন্নতা" value={`${toBn(report.percent)}%`} icon={Gauge} progress={report.percent} />
          <StatTile label="জমা দেওয়া দিন" value={`${toBn(report.submittedDays)}/${toBn(report.totalDays)}`} icon={ClipboardCheck} tone="info" />
          <StatTile label="সাইকেলের সময়" value={`${toBn(progress?.percentage ?? 0)}%`} note={`${toBn(progress?.day ?? 0)}তম দিন`} icon={BarChart3} progress={progress?.percentage} />
        </div>
      )}

      {staff ? (
        <Link href="/dashboard/ustad" className="flex items-center gap-4 rounded-card border border-gold/40 bg-gold-soft p-4 transition hover:shadow-md">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold text-white dark:text-[#2a1d02]">
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
