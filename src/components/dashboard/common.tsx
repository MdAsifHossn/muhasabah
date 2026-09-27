import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: { label: string; href: string } }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">{eyebrow}</p> : null}<h1 className="mt-1 text-3xl font-bold text-emerald-950">{title}</h1>{description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{description}</p> : null}</div>{action ? <Button asChild><Link href={action.href}>{action.label}</Link></Button> : null}</div>;
}

export function StatCard({ label, value, note, icon: Icon }: { label: string; value: string | number; note?: string; icon?: LucideIcon }) {
  return <Card><CardContent className="flex items-start justify-between gap-4"><div><p className="text-sm text-stone-500">{label}</p><p className="mt-2 text-2xl font-bold text-emerald-950">{value}</p>{note ? <p className="mt-1 text-xs text-stone-400">{note}</p> : null}</div>{Icon ? <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon className="size-5" /></div> : null}</CardContent></Card>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "green" | "amber" | "red" | "neutral" }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tone === "green" && "bg-emerald-50 text-emerald-700", tone === "amber" && "bg-amber-50 text-amber-700", tone === "red" && "bg-red-50 text-red-700", tone === "neutral" && "bg-stone-100 text-stone-600")}>{children}</span>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center"><h2 className="font-bold text-stone-800">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">{description}</p></div>;
}

export const inputClass = "h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";
export const textareaClass = "min-h-28 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10";