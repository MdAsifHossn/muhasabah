import { Role } from "@prisma/client";
import { addDays } from "date-fns";
import { Crown, Flame, Trophy } from "lucide-react";
import Link from "next/link";

import { toBn } from "@/components/amalnama/report-data";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Card } from "@/components/ui/card";
import { SUMMARY_WINDOW_DAYS } from "@/lib/cycles";
import { getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateLeaderboard } from "@/lib/scoring";
import { loadPrayerStreaks } from "@/lib/streaks";
import { cn } from "@/lib/utils";

export const metadata = { title: "লিডারবোর্ড" };

const medal = ["bg-marble-400 text-marble-950", "bg-slate-300 text-slate-900", "bg-orange-300 text-orange-950"];

type Tab = "overall" | "streak";

function RankBadge({ rank }: { rank: number }) {
  return (
    <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", medal[rank - 1] ?? "bg-surface-sunken text-muted-foreground")}>
      {rank === 1 ? <Crown className="size-4" /> : toBn(rank)}
    </span>
  );
}

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await requireUser();
  const tab: Tab = (await searchParams).tab === "streak" ? "streak" : "overall";

  // Rolling window: the last 30 Bangladesh days.
  const today = startOfBangladeshDay(getBangladeshToday());
  const from = startOfBangladeshDay(addDays(today, -(SUMMARY_WINDOW_DAYS - 1)));

  // Members who hid their Amalnama never appear; only ordinary members appear (never USTADH).
  const users = await prisma.user.findMany({
    where: { isActive: true, hideAmalnama: false, role: Role.MEMBER },
    select: {
      id: true,
      name: true,
      gender: true,
      joinedAt: true,
      dailyEntries: { where: { date: { gte: from, lte: today } }, select: { status: true, totalScore: true, maxPossibleScore: true } },
    },
  });

  const overall =
    tab === "overall"
      ? calculateLeaderboard(
          users.map((user) => ({ userId: user.id, name: user.name, entries: user.dailyEntries })),
          SUMMARY_WINDOW_DAYS,
        ).filter((row) => row.submittedDays > 0)
      : [];

  const streakRows =
    tab === "streak"
      ? await loadPrayerStreaks(users).then((map) =>
          users
            .map((user) => ({ user, streak: map.get(user.id) ?? null }))
            .filter((row): row is { user: (typeof users)[number]; streak: NonNullable<typeof row.streak> } => !!row.streak && (row.streak.current > 0 || row.streak.best > 0))
            .sort((a, b) => b.streak.current - a.streak.current || b.streak.best - a.streak.best || a.user.name.localeCompare(b.user.name, "bn"))
            .map((row, index) => ({ ...row, rank: index + 1 })),
        )
      : [];
  const topCurrent = Math.max(1, ...streakRows.map((row) => row.streak.current));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        eyebrow={tab === "streak" ? "সেরা আমল" : "শেষ ৩০ দিন"}
        title="লিডারবোর্ড"
        description="প্রতিযোগিতা নয়, পরস্পরকে উৎসাহ দেওয়াই উদ্দেশ্য — কারো আমলের বিস্তারিত এখানে দেখানো হয় না।"
      />

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1" role="tablist" aria-label="র‍্যাংকিংয়ের ধরন">
        {(
          [
            { key: "overall", label: "সামগ্রিক স্কোর", icon: Trophy },
            { key: "streak", label: "তাকবীরে উলা ধারাবাহিকতা", icon: Flame },
          ] as const
        ).map((item) => (
          <Link
            key={item.key}
            href={item.key === "overall" ? "/dashboard/leaderboard" : "/dashboard/leaderboard?tab=streak"}
            role="tab"
            aria-selected={tab === item.key}
            className={cn(
              "flex h-11 items-center justify-center gap-1.5 rounded-xl px-2 text-center text-[13px] font-semibold leading-4 transition",
              tab === item.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className={cn("size-4 shrink-0", item.key === "streak" ? "text-gold" : "text-primary")} />
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "overall" ? (
        overall.length === 0 ? (
          <EmptyState icon={Trophy} title="এখনো র‍্যাংকিং নেই" description="সদস্যরা আমলনামা জমা দিলে এখানে দেখা যাবে।" />
        ) : (
          <>
            <p className="px-1 text-xs leading-5 text-muted-foreground">নিয়মিততা ও সম্পন্নতা মিলিয়ে শেষ ৩০ দিনের সামগ্রিক স্কোর।</p>
            <Card className="divide-y divide-hairline overflow-hidden">
              {overall.map((row) => {
                const self = row.userId === session.user.id;
                return (
                  <div key={row.userId} className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", self && "bg-primary-soft")}>
                    <RankBadge rank={row.rank} />
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
          </>
        )
      ) : streakRows.length === 0 ? (
        <EmptyState icon={Flame} title="এখনো কারো ধারাবাহিকতা নেই" description="পাঁচ ওয়াক্তে তাকবীরে উলা (ভাই) বা আউয়াল ওয়াক্তে (বোন) নামাজ টানা হলে এখানে দেখা যাবে।" />
      ) : (
        <>
          <p className="px-1 text-xs leading-5 text-muted-foreground">
            পাঁচ ওয়াক্তেই তাকবীরে উলা (ভাই) / আউয়াল ওয়াক্ত (বোন) — টানা কত দিন। একটি ওয়াক্ত মিস হলে গণনা নতুন করে শুরু হয়।
          </p>
          <Card className="divide-y divide-hairline overflow-hidden">
            {streakRows.map(({ user, streak, rank }) => {
              const self = user.id === session.user.id;
              return (
                <div key={user.id} className={cn("flex items-center gap-3 px-4 py-3 sm:px-5", self && "bg-gold-soft")}>
                  <RankBadge rank={rank} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">
                      {user.name} {self ? <span className="text-xs font-medium text-gold-foreground">(আপনি)</span> : null}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round((streak.current / topCurrent) * 100)}%` }} />
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">সর্বোচ্চ {toBn(streak.best)}</span>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-base font-bold tabular-nums text-gold-foreground">
                    <Flame className="size-4" /> {toBn(streak.current)}
                    <span className="text-xs font-semibold text-muted-foreground">দিন</span>
                  </span>
                </div>
              );
            })}
          </Card>
        </>
      )}
    </div>
  );
}
