import { Medal } from "lucide-react";

import { EmptyState, PageHeader } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { getElapsedCycleDays } from "@/lib/analytics";
import { getActiveCycle } from "@/lib/cycles";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateLeaderboard } from "@/lib/scoring";

export default async function LeaderboardPage() {
  await requireUser();
  const cycle = await getActiveCycle();
  if (!cycle) return <EmptyState title="Leaderboard প্রস্তুত নয়" description="সক্রিয় সাইকেল শুরু হলে summary ranking দেখা যাবে।" />;
  const users = await prisma.user.findMany({ where: { isActive: true, hideAmalnama: false }, select: { id: true, name: true, dailyEntries: { where: { cycleId: cycle.id }, select: { status: true, totalScore: true, maxPossibleScore: true } } } });
  const rows = calculateLeaderboard(users.map((user) => ({ userId: user.id, name: user.name, entries: user.dailyEntries })), getElapsedCycleDays(cycle.startDate, cycle.endDate));
  return <div className="mx-auto max-w-5xl space-y-7"><PageHeader eyebrow={cycle.title} title="Leaderboard" description="এখানে শুধু নাম, consistency ও overall score দেখানো হয়; ব্যক্তিগত আমলের উত্তর গোপন থাকে।" />{rows.length === 0 ? <EmptyState title="এখনো ranking নেই" description="সদস্যরা আমলনামা জমা দিলে ranking দেখা যাবে।" /> : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-left text-sm sm:min-w-[650px]"><thead className="bg-stone-50 text-stone-500"><tr><th className="px-3 py-4 sm:px-5">Rank</th><th className="px-3 py-4 sm:px-5">Member</th><th className="hidden px-5 py-4 sm:table-cell">Submitted Days</th><th className="hidden px-5 py-4 sm:table-cell">Consistency</th><th className="px-3 py-4 text-right sm:px-5 sm:text-left">Overall Score</th></tr></thead><tbody className="divide-y divide-stone-100">{rows.map((row) => <tr key={row.userId} className={row.rank<=3?"bg-amber-50/40":""}><td className="px-3 py-4 sm:px-5"><span className="inline-flex items-center gap-2 font-bold">{row.rank<=3?<Medal className="size-4 text-amber-600"/>:null}#{row.rank}</span></td><td className="px-3 py-4 font-semibold sm:px-5">{row.name}</td><td className="hidden px-5 py-4 sm:table-cell">{row.submittedDays}</td><td className="hidden px-5 py-4 sm:table-cell">{row.consistencyPercentage}%</td><td className="px-3 py-4 text-right font-bold text-emerald-800 sm:px-5 sm:text-left">{row.overallScore}%</td></tr>)}</tbody></table></CardContent></Card>}</div>;
}