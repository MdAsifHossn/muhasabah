"use client";

import { BarChart3, BookMarked, BookOpen, BookOpenCheck, ClipboardCheck, Gauge, History, ListChecks, MessageCircleHeart, RefreshCcw, Settings, ShieldCheck, Trophy, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

const memberItems = [
  ["Overview", "/dashboard", Gauge],
  ["আজকের আমলনামা", "/dashboard/amalnama", ClipboardCheck],
  ["আল-কুরআন", "/dashboard/quran", BookOpenCheck],
  ["হাদীস কর্নার", "/dashboard/hadith", BookMarked],
  ["আমলনামার ইতিহাস", "/dashboard/amalnama/history", History],
  ["আমার অগ্রগতি", "/dashboard/progress", BarChart3],
  ["সাইকেলের হিসাব", "/dashboard/cycles", RefreshCcw],
  ["Leaderboard", "/dashboard/leaderboard", Trophy],
  ["দ্বীনি বই", "/dashboard/books", BookOpen],
  ["Admin Review", "/dashboard/reviews", MessageCircleHeart],
  ["Profile", "/dashboard/profile", UserRound],
] as const;

const adminItems = [
  ["Admin Overview", "/dashboard/admin", ShieldCheck], ["Members", "/dashboard/admin/members", Users],
  ["Amal Items", "/dashboard/admin/amal-items", ListChecks], ["Cycles", "/dashboard/admin/cycles", RefreshCcw],
  ["Reviews", "/dashboard/admin/reviews", MessageCircleHeart], ["Settings", "/dashboard/admin/settings", Settings],
] as const;

export function DashboardNav({ isAdmin, compact = false }: { isAdmin: boolean; compact?: boolean }) {
  const pathname = usePathname();
  const itemClass = (href: string) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", pathname === href ? "bg-emerald-950 text-white" : "text-stone-600 hover:bg-emerald-50 hover:text-emerald-900");
  return <nav aria-label="Dashboard navigation" className={cn("space-y-1", compact && "max-h-[65vh] overflow-y-auto")}>{memberItems.map(([label, href, Icon]) => <Link key={href} href={href} className={itemClass(href)}><Icon className="size-4" /> {label}</Link>)}{isAdmin ? <div className="mt-5 border-t border-stone-200 pt-4"><p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">Admin</p>{adminItems.map(([label, href, Icon]) => <Link key={href} href={href} className={itemClass(href)}><Icon className="size-4" /> {label}</Link>)}</div> : null}<div className="mt-4 border-t border-stone-200 pt-3"><SignOutButton /></div></nav>;
}