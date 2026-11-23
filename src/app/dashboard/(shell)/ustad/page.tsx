import { DailyEntryStatus, Gender, Role } from "@prisma/client";
import { addDays } from "date-fns";
import { AlertTriangle, CalendarCheck2, ClipboardList, Flame, Gauge, ListChecks, Megaphone, MessageCircleHeart, Trophy, UsersRound } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { StatTile } from "@/components/design/stat-tile";
import { MemberBoard, type BoardMember } from "@/components/ustad/member-board";
import { Badge } from "@/components/ui/badge";
import { loadPrayerStreaks } from "@/lib/streaks";
import { bangladeshDateKey, formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "তত্ত্বাবধান ড্যাশবোর্ড" };

const SUBMITTED = [DailyEntryStatus.SUBMITTED, DailyEntryStatus.LOCKED];
const avg = (values: number[]) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0);

function timeAgo(date: Date) {
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes.toLocaleString("bn-BD")} মিনিট আগে`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours.toLocaleString("bn-BD")} ঘণ্টা আগে`;
  return `${Math.round(hours / 24).toLocaleString("bn-BD")} দিন আগে`;
}

export default async function UstadDashboardPage() {
  const session = await requireUstadhOrAdmin();
  const today = startOfBangladeshDay(getBangladeshToday());

  const members = await prisma.user.findMany({
    where: { isActive: true, role: Role.MEMBER },
    orderBy: { name: "asc" },
    select: { id: true, name: true, gender: true, hideAmalnama: true, joinedAt: true },
  });
  const brothers = members.filter((member) => member.gender === Gender.MALE).length;
  const sisters = members.filter((member) => member.gender === Gender.FEMALE).length;

  const header = (
    <PageHeader
      eyebrow="উস্তাদ প্যানেল"
      title={`আসসালামু আলাইকুম, ${session.user.name}`}
      description={`${formatBanglaDate(today)} — সদস্যদের আজকের আমলনামা, যাদের মনোযোগ দরকার এবং সাম্প্রতিক জমা এক নজরে।`}
    />
  );

  // Last 7 Bangladesh days (oldest first).
  const days = Array.from({ length: 7 }, (_, index) => startOfBangladeshDay(addDays(today, index - 6)));
  const dayKeys = days.map(bangladeshDateKey);
  const visibleMembers = members.filter((member) => !member.hideAmalnama);
  const visibleIds = visibleMembers.map((member) => member.id);

  const [weekEntries, lastSubmitted, streaks, recent] = await Promise.all([
    prisma.dailyAmalEntry.findMany({
      where: { userId: { in: visibleIds }, date: { gte: days[0], lte: today } },
      select: { userId: true, date: true, status: true, completionPercentage: true, isPeriodDay: true },
    }),
    prisma.dailyAmalEntry.groupBy({
      by: ["userId"],
      where: { userId: { in: visibleIds }, status: { in: SUBMITTED } },
      _max: { date: true },
    }),
    loadPrayerStreaks(visibleMembers),
    prisma.dailyAmalEntry.findMany({
      where: { userId: { in: visibleIds }, status: { in: SUBMITTED } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, date: true, completionPercentage: true, updatedAt: true, isPeriodDay: true, user: { select: { id: true, name: true, gender: true } } },
    }),
  ]);

  const lastByUser = new Map(lastSubmitted.map((row) => [row.userId, row._max.date]));
  const entryKey = (userId: string, date: Date) => `${userId}:${bangladeshDateKey(date)}`;
  const entryMap = new Map(weekEntries.map((entry) => [entryKey(entry.userId, entry.date), entry]));
  const todayKey = bangladeshDateKey(today);
  const threeDaysAgo = startOfBangladeshDay(addDays(today, -2));

  const board: BoardMember[] = members.map((member) => {
    if (member.hideAmalnama)
      return { id: member.id, name: member.name, gender: member.gender, hidden: true, todayStatus: null, todayPercent: null, weekPercent: null, lastSubmitted: null, needsAttention: false, spark: [], streak: null };
    const joined = startOfBangladeshDay(member.joinedAt);
    const memberDays = days.filter((day) => day >= joined);
    const spark = dayKeys.map((key, index) => {
      const entry = entryMap.get(`${member.id}:${key}`);
      if (days[index] < joined) return null;
      return entry && SUBMITTED.includes(entry.status as (typeof SUBMITTED)[number]) ? Math.round(entry.completionPercentage) : null;
    });
    // Missing days count as 0 — the 7-day average reflects consistency, not just good days.
    const weekPercent = memberDays.length ? Math.round(spark.reduce<number>((sum, value) => sum + (value ?? 0), 0) / memberDays.length) : null;
    const todayEntry = entryMap.get(`${member.id}:${todayKey}`);
    const todayStatus = todayEntry ? (SUBMITTED.includes(todayEntry.status as (typeof SUBMITTED)[number]) ? "submitted" : "draft") : "none";
    const last = lastByUser.get(member.id) ?? null;
    const inactiveLong = (!last || last < threeDaysAgo) && joined < threeDaysAgo;
    return {
      id: member.id,
      name: member.name,
      gender: member.gender,
      hidden: false,
      todayStatus,
      todayPercent: todayEntry ? Math.round(todayEntry.completionPercentage) : null,
      weekPercent,
      lastSubmitted: last ? formatBanglaDate(last) : null,
      needsAttention: inactiveLong || (weekPercent !== null && memberDays.length >= 3 && weekPercent < 40),
      spark,
      streak: (() => {
        const value = streaks.get(member.id);
        return value ? { current: value.current, best: value.best, label: value.label } : null;
      })(),
    };
  });
  const topStreaks = board
    .filter((member) => member.streak && member.streak.current > 0)
    .sort((a, b) => (b.streak?.current ?? 0) - (a.streak?.current ?? 0))
    .slice(0, 5);

  const visible = board.filter((member) => !member.hidden);
  const submittedToday = visible.filter((member) => member.todayStatus === "submitted");
  const todayAverage = avg(submittedToday.map((member) => member.todayPercent ?? 0));
  const weekAverage = avg(visible.map((member) => member.weekPercent).filter((value): value is number => value !== null));
  const attention = board.filter((member) => member.needsAttention);
  const submittedShare = visible.length ? Math.round((submittedToday.length / visible.length) * 100) : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      {header}

      <section className="hero-surface overflow-hidden rounded-card p-5 shadow-raised sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-on-hero-muted">প্রতিদিনের আমলনামা</p>
            <h2 className="mt-1 text-xl font-bold sm:text-2xl">আজকের জমার অবস্থা</h2>
            <p className="mt-1 text-sm text-on-hero-muted">{formatBanglaDate(today)}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold tabular-nums text-marble-300">
              {submittedToday.length.toLocaleString("bn-BD")}
              <span className="text-xl text-on-hero-muted">/{visible.length.toLocaleString("bn-BD")}</span>
            </p>
            <p className="text-xs text-on-hero-muted">আজ জমা দিয়েছেন</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-marble-300" style={{ width: `${submittedShare}%` }} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="সদস্য" value={members.length.toLocaleString("bn-BD")} note={`ভাই ${brothers.toLocaleString("bn-BD")} • বোন ${sisters.toLocaleString("bn-BD")}`} icon={UsersRound} />
        <StatTile label="আজকের গড়" value={`${todayAverage.toLocaleString("bn-BD")}%`} note="যারা জমা দিয়েছেন" icon={Gauge} progress={todayAverage} />
        <StatTile label="৭ দিনের গড়" value={`${weekAverage.toLocaleString("bn-BD")}%`} note="না জমা দেওয়া দিন ০% ধরে" icon={CalendarCheck2} tone="gold" />
        <StatTile label="মনোযোগ দরকার" value={attention.length.toLocaleString("bn-BD")} note="৩ দিন জমা নেই বা গড় ৪০%-এর নিচে" icon={AlertTriangle} tone="danger" />
      </div>

      <nav aria-label="দ্রুত কাজ" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { href: "/dashboard/amalnama/grid?days=7", label: "সদস্যদের আমলনামা", icon: ClipboardList },
          { href: "/dashboard/leaderboard", label: "লিডারবোর্ড", icon: Trophy },
          { href: "/dashboard/ustad/reviews", label: "রিভিউ লিখুন", icon: MessageCircleHeart },
          { href: "/dashboard/ustad/notices", label: "নোটিশ দিন", icon: Megaphone },
          { href: "/dashboard/amal-items", label: "আমল আইটেম", icon: ListChecks },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="surface flex items-center gap-2.5 rounded-card p-3 text-sm font-semibold text-foreground transition hover:border-hairline-strong active:scale-[0.98]">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
              <item.icon className="size-[18px]" />
            </span>
            <span className="leading-5">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="min-w-0 space-y-3">
          <h2 className="px-1 text-lg font-bold text-foreground">সদস্যদের অবস্থা</h2>
          {members.length ? <MemberBoard members={board} /> : <EmptyState icon={UsersRound} title="এখনও কোনো সদস্য নেই" description="সদস্যরা নিবন্ধন করলে এখানে দেখা যাবে।" />}
        </section>

        <aside className="space-y-5">
          <section className="surface rounded-card p-4">
            <h2 className="flex items-center gap-2 font-bold text-foreground">
              <Flame className="size-4 text-gold" /> সেরা ধারাবাহিকতা
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">পাঁচ ওয়াক্তে তাকবীরে উলা (ভাই) / আউয়াল ওয়াক্ত (বোন) — টানা দিন</p>
            {topStreaks.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">এখনো কারো চলমান ধারাবাহিকতা নেই।</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {topStreaks.map((member, index) => (
                  <li key={member.id} className="flex items-center gap-2.5">
                    <span className={index === 0 ? "grid size-7 shrink-0 place-items-center rounded-full bg-gold text-xs font-bold text-white" : "grid size-7 shrink-0 place-items-center rounded-full bg-surface-sunken text-xs font-bold text-muted-foreground"}>
                      {(index + 1).toLocaleString("bn-BD")}
                    </span>
                    <Link href={`/dashboard/amalnama/grid?member=${member.id}&days=7`} className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground hover:text-primary">
                      {member.name}
                    </Link>
                    <span className="shrink-0 rounded-lg bg-gold-soft px-2 py-0.5 text-xs font-bold text-gold-foreground">{member.streak!.current.toLocaleString("bn-BD")} দিন</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="surface rounded-card p-4">
            <h2 className="flex items-center gap-2 font-bold text-foreground">
              <AlertTriangle className="size-4 text-warning" /> মনোযোগ দরকার
            </h2>
            {attention.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">আলহামদুলিল্লাহ, সবাই নিয়মিত আছেন।</p>
            ) : (
              <ul className="mt-3 divide-y divide-hairline">
                {attention.slice(0, 8).map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">শেষ জমা: {member.lastSubmitted ?? "কখনো নয়"} • ৭ দিন {(member.weekPercent ?? 0).toLocaleString("bn-BD")}%</p>
                    </div>
                    <Link href={`/dashboard/amalnama/grid?member=${member.id}&days=7`} className="shrink-0 text-xs font-semibold text-primary">
                      দেখুন
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="surface rounded-card p-4">
            <h2 className="font-bold text-foreground">সাম্প্রতিক জমা</h2>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">এখনও কোনো জমা নেই।</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {recent.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/dashboard/amalnama/grid?member=${entry.user.id}&days=7`} className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-surface-sunken">
                      <span className={entry.user.gender === Gender.FEMALE ? "grid size-9 shrink-0 place-items-center rounded-full bg-female-soft text-sm font-bold text-female" : "grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary"}>
                        {entry.user.name.trim().slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{entry.user.name}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {formatBanglaDate(entry.date)} • {timeAgo(entry.updatedAt)}
                        </span>
                      </span>
                      {entry.isPeriodDay ? <Badge variant="female">ওজরের দিন</Badge> : null}
                      <span className="text-sm font-bold tabular-nums text-primary">{Math.round(entry.completionPercentage).toLocaleString("bn-BD")}%</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
