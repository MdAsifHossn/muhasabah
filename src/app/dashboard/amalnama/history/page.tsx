import { DailyEntryStatus } from "@prisma/client";
import { format } from "date-fns";

import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { entryStatusLabels } from "@/lib/constants";
import { getActiveCycle } from "@/lib/cycles";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function AmalnamaHistoryPage() {
  const session = await requireUser();
  const cycle = await getActiveCycle();
  const entries = cycle ? await prisma.dailyAmalEntry.findMany({ where: { userId: session.user.id, cycleId: cycle.id }, orderBy: { date: "desc" } }) : [];
  return <div className="mx-auto max-w-5xl space-y-7"><PageHeader eyebrow="ব্যক্তিগত তথ্য" title="আমলনামার ইতিহাস" description="শুধু আপনার জমা দেওয়া ও খসড়া আমলনামা এখানে দেখা যায়।" action={{ label: "আজকের আমলনামা", href: "/dashboard/amalnama" }} />{entries.length === 0 ? <EmptyState title="এখনো কোনো আমলনামা নেই" description="আজকের আমলনামা পূরণ করলে ইতিহাস এখানে দেখা যাবে।" /> : <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-stone-50 text-stone-500"><tr><th className="px-5 py-4">তারিখ</th><th className="px-5 py-4">অবস্থা</th><th className="px-5 py-4">স্কোর</th><th className="px-5 py-4">সর্বোচ্চ</th><th className="px-5 py-4">শতকরা</th></tr></thead><tbody className="divide-y divide-stone-100">{entries.map((entry) => <tr key={entry.id}><td className="px-5 py-4 font-medium">{format(entry.date, "dd MMM yyyy")}</td><td className="px-5 py-4"><StatusBadge tone={entry.status === DailyEntryStatus.SUBMITTED ? "green" : "amber"}>{entryStatusLabels[entry.status]}</StatusBadge></td><td className="px-5 py-4">{entry.totalScore}</td><td className="px-5 py-4">{entry.maxPossibleScore}</td><td className="px-5 py-4 font-bold text-emerald-800">{entry.completionPercentage}%</td></tr>)}</tbody></table></CardContent></Card>}</div>;
}