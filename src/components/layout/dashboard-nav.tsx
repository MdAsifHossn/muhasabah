"use client";

import type { Role } from "@prisma/client";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  ClipboardCheck,
  Gauge,
  History,
  LayoutGrid,
  ListChecks,
  MessageCircleHeart,
  MoreHorizontal,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: typeof Gauge };

const memberItems: NavItem[] = [
  { label: "হোম", href: "/dashboard", icon: Gauge },
  { label: "আজকের আমলনামা", href: "/dashboard/amalnama", icon: ClipboardCheck },
  { label: "আমলনামা তালিকা", href: "/dashboard/amalnama/list", icon: History },
  { label: "গ্রিড আমলনামা (১/৭/৩০/৪০ দিন)", href: "/dashboard/amalnama/grid", icon: LayoutGrid },
  { label: "আল-কুরআন", href: "/quran", icon: BookOpenCheck },
  { label: "অফলাইন পড়া", href: "/dashboard/offline", icon: WifiOff },
  { label: "হাদীস কর্নার", href: "/dashboard/hadith", icon: BookMarked },
  { label: "আমার অগ্রগতি", href: "/dashboard/progress", icon: BarChart3 },
  { label: "সাইকেলের হিসাব", href: "/dashboard/cycles", icon: RefreshCcw },
  { label: "লিডারবোর্ড", href: "/dashboard/leaderboard", icon: Trophy },
  { label: "দ্বীনি বই", href: "/dashboard/books", icon: BookOpen },
  { label: "উস্তাদের রিভিউ", href: "/dashboard/reviews", icon: MessageCircleHeart },
  { label: "প্রোফাইল", href: "/dashboard/profile", icon: UserRound },
];

const ustadItems: NavItem[] = [
  { label: "আমল আইটেম ব্যবস্থাপনা", href: "/dashboard/amal-items", icon: ListChecks },
  { label: "ছেলেদের আমলনামা", href: "/dashboard/amal-items/men", icon: UserRound },
  { label: "মেয়েদের আমলনামা", href: "/dashboard/amal-items/women", icon: Users },
];

const adminItems: NavItem[] = [
  { label: "অ্যাডমিন ওভারভিউ", href: "/dashboard/admin", icon: ShieldCheck },
  { label: "সদস্য ব্যবস্থাপনা", href: "/dashboard/admin/members", icon: Users },
  { label: "সাইকেল ব্যবস্থাপনা", href: "/dashboard/admin/cycles", icon: RefreshCcw },
  { label: "রিভিউ", href: "/dashboard/admin/reviews", icon: MessageCircleHeart },
  { label: "সেটিংস", href: "/dashboard/admin/settings", icon: Settings },
];

const bottomItems: NavItem[] = [
  { label: "হোম", href: "/dashboard", icon: Gauge },
  { label: "আমল", href: "/dashboard/amalnama", icon: ClipboardCheck },
  { label: "কুরআন", href: "/quran", icon: BookOpenCheck },
  { label: "তালিকা", href: "/dashboard/amalnama/list", icon: History },
  { label: "প্রোফাইল", href: "/dashboard/profile", icon: UserRound },
];

const canSeeUstad = (role: Role) => role === "USTADH" || role === "ADMIN";
const canSeeAdmin = (role: Role) => role === "ADMIN";

const ALL_HREFS = [...new Set([...memberItems, ...ustadItems, ...adminItems, ...bottomItems].map((item) => item.href))];

/** "/dashboard" only matches itself; every other item also matches its sub-routes.
 *  When one item nests inside another (আমলনামা ⊂ আমলনামা তালিকা), only the
 *  LONGEST matching href counts as active — never two items at once. */
function isActive(pathname: string, href: string) {
  const matches = ALL_HREFS.filter((h) =>
    h === "/dashboard" ? pathname === h : pathname === h || pathname.startsWith(`${h}/`),
  );
  if (!matches.includes(href)) return false;
  const best = matches.reduce((longest, h) => (h.length > longest.length ? h : longest), matches[0]);
  return best === href;
}

function linkClass(active: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    active ? "bg-emerald-950 text-white" : "text-stone-600 hover:bg-emerald-50 hover:text-emerald-900",
  );
}

function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  const render = (items: NavItem[]) =>
    items.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={linkClass(isActive(pathname, item.href))}
      >
        <item.icon className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    ));

  return (
    <nav aria-label="Dashboard navigation" className="space-y-1">
      {render(memberItems)}
      {canSeeUstad(role) ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
            উস্তাদজি
          </p>
          {render(ustadItems)}
        </div>
      ) : null}
      {canSeeAdmin(role) ? (
        <div className="mt-5 border-t border-stone-200 pt-4">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-400">
            অ্যাডমিন
          </p>
          {render(adminItems)}
        </div>
      ) : null}
    </nav>
  );
}

export function DashboardNav({ role, className, compact = false }: { role: Role; className?: string; compact?: boolean }) {
  return (
    <div className={cn(compact && "max-h-[62vh] overflow-y-auto pr-1", className)}>
      <NavList role={role} />
      <div className="mt-5 border-t border-stone-200 pt-3">
        <SignOutButton />
      </div>
    </div>
  );
}

/** Full-height slide-up menu used from the mobile top bar. */
export function MobileMenu({ role, name }: { role: Role; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="মেনু খুলুন"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-xl border border-stone-200 bg-white text-stone-600 active:bg-stone-100"
      >
        {open ? <X className="size-5" /> : <MoreHorizontal className="size-5" />}
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="মেনু বন্ধ করুন"
            onClick={() => setOpen(false)}
            className="fixed inset-0 -z-10 cursor-default bg-emerald-950/40 backdrop-blur-[2px]"
          />
          <div className="absolute right-0 top-11 w-[min(19rem,calc(100vw-2.5rem))] rounded-2xl border border-stone-200 bg-white p-3 shadow-2xl">
            <p className="truncate px-3 pb-2 text-sm font-bold text-emerald-950">{name}</p>
            <div className="max-h-[60vh] overflow-y-auto">
              <NavList role={role} onNavigate={() => setOpen(false)} />
            </div>
            <div className="mt-3 border-t border-stone-200 pt-2">
              <SignOutButton />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

/** App-style bottom navigation shown on phones and tablets. */
export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {bottomItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 pt-1.5 pb-1 text-[10px] font-bold transition-colors",
                  active ? "text-emerald-950" : "text-stone-400",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-3 top-0 h-0.5 rounded-full transition-colors",
                    active ? "bg-emerald-700" : "bg-transparent",
                  )}
                />
                <item.icon className={cn("size-5", active && "stroke-[2.4]")} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
