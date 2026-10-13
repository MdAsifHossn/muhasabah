import { CalendarCheck2, Flame, Gauge, TriangleAlert } from "lucide-react";

import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { getElapsedCycleDays, summarizeEntries } from "@/lib/analytics";
import { getActiveCycle, getCycleProgress } from "@/lib/cycles";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function ProgressPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();
  if (!cycle) return <EmptyState title="কোনো সক্রিয় সাইকেল নেই" description="সাইকেল সক্রিয় হলে অগ্রগতি দেখা যাবে।" />;
  const entries = await prisma.dailyAmalEntry.findMany({ where: { userId: session.user.id, cycleId: cycle.id }, orderBy: { date: "asc" } });
  const elapsed = getElapsedCycleDays(cycle.startDate, cycle.endDate);
  const summary = summarizeEntries(entries, elapsed);
  const progress = getCycleProgress(cycle.startDate, cycle.endDate);
  return <div className="mx-auto max-w-6xl space-y-7"><PageHeader eyebrow={cycle.title} title="আমার অগ্রগতি" description="প্রতিদিনের জমা, ধারাবাহিকতা ও গড় completion-এর ব্যক্তিগত সারাংশ।" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="বর্তমান ধারাবাহিকতা" value={`${summary.streak} দিন`} icon={Flame} /><StatCard label="জমা দেওয়া" value={`${summary.submittedDays} / ${elapsed}`} icon={CalendarCheck2} /><StatCard label="মিসড দিন" value={summary.missedDays} icon={TriangleAlert} /><StatCard label="Cycle average" value={`${summary.average}%`} icon={Gauge} /></div><Card><CardContent><div className="flex items-end justify-between"><div><p className="text-sm text-stone-500">সাইকেলের সময়গত অগ্রগতি</p><p className="mt-1 text-xl font-bold">Day {progress.day} of {progress.totalDays}</p></div><p className="text-2xl font-bold text-emerald-800">{progress.percentage}%</p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-emerald-800" style={{ width: `${progress.percentage}%` }} /></div></CardContent></Card><Card><CardContent><h2 className="text-lg font-bold text-emerald-950">সাম্প্রতিক দিনসমূহ</h2>{entries.length === 0 ? <p className="mt-4 text-sm text-stone-500">এখনো কোনো entry জমা দেওয়া হয়নি।</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{entries.slice(-12).reverse().map((entry) => <div key={entry.id} className="rounded-xl border border-stone-200 p-4"><p className="text-xs text-stone-400">{entry.date.toLocaleDateString("bn-BD")}</p><p className="mt-2 text-xl font-bold text-emerald-900">{entry.completionPercentage}%</p><div className="mt-2"><StatusBadge tone={entry.status === "SUBMITTED" ? "green" : "amber"}>{entry.status === "SUBMITTED" ? "জমা" : "খসড়া"}</StatusBadge></div></div>)}</div>}</CardContent></Card></div>;
}