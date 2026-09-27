import { differenceInCalendarDays } from "date-fns";

import { EmptyState, PageHeader, StatusBadge } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { cycleStatusLabels } from "@/lib/constants";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function CyclesPage() {
  const session = await requireUser();
  const cycles = await prisma.cycle.findMany({ orderBy: { startDate: "desc" }, include: { entries: { where: { userId: session.user.id } } } });
  return <div className="mx-auto max-w-5xl space-y-7"><PageHeader title="সাইকেলের হিসাব" description="প্রতিটি মুহাসাবাহ সাইকেলে আপনার ব্যক্তিগত participation ও average।" />{cycles.length === 0 ? <EmptyState title="কোনো সাইকেল নেই" description="অ্যাডমিন সাইকেল তৈরি করলে এখানে দেখা যাবে।" /> : <div className="space-y-4">{cycles.map((cycle) => { const submitted=cycle.entries.filter((entry)=>entry.status!=="DRAFT"); const average=submitted.length?Math.round(submitted.reduce((sum,entry)=>sum+entry.completionPercentage,0)/submitted.length):0; const duration=differenceInCalendarDays(cycle.endDate,cycle.startDate)+1; return <Card key={cycle.id}><CardContent className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-bold text-emerald-950">{cycle.title}</h2><StatusBadge tone={cycle.status==="ACTIVE"?"green":"neutral"}>{cycleStatusLabels[cycle.status]}</StatusBadge></div><p className="mt-2 text-sm text-stone-500">{cycle.startDate.toLocaleDateString("bn-BD")} — {cycle.endDate.toLocaleDateString("bn-BD")} • {duration} দিন</p></div><div className="grid grid-cols-2 gap-6 text-center"><div><p className="text-2xl font-bold text-emerald-900">{submitted.length}</p><p className="text-xs text-stone-400">জমা</p></div><div><p className="text-2xl font-bold text-emerald-900">{average}%</p><p className="text-xs text-stone-400">গড়</p></div></div></CardContent></Card>; })}</div>}</div>;
}