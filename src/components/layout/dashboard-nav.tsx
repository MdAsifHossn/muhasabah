"use client";

import type { Role } from "@prisma/client";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Inbox,
  MessagesSquare,
  CalendarRange,
  ClipboardCheck,
  Home,
  LayoutGrid,
  ListChecks,
  Megaphone,
  Menu,
  MessageCircleHeart,
  NotebookPen,
  RefreshCcw,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  UsersRound,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { title?: string; items: NavItem[]; roles?: Role[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: "হোম", href: "/dashboard", icon: Home },
      { label: "আজকের আমল", href: "/dashboard/amalnama", icon: ClipboardCheck },
      { label: "আমলের খাতা (৭/৩০/৪০ দিন)", href: "/dashboard/amalnama/grid", icon: LayoutGrid },
      { label: "আগের দিনের আমল", href: "/dashboard/amalnama/history", icon: CalendarRange },
      { label: "আমার উন্নতি", href: "/dashboard/progress", icon: BarChart3 },
    ],
  },
  {
    title: "পড়াশোনা",
    items: [
      { label: "আল-কুরআন", href: "/quran", icon: BookOpenCheck },
      { label: "হাদীস", href: "/dashboard/hadith", icon: BookMarked },
      { label: "আমার বই পড়া", href: "/dashboard/books", icon: BookOpen },
      { label: "নেট ছাড়া কুরআন", href: "/dashboard/offline", icon: WifiOff },
      { label: "হিজরি ক্যালেন্ডার", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "উস্তাদজি",
    items: [
      { label: "উস্তাদজিকে বার্তা", href: "/dashboard/messages", icon: MessagesSquare },
      { label: "নোটিশ", href: "/dashboard/notices", icon: Megaphone },
      { label: "উস্তাদজির মতামত", href: "/dashboard/reviews", icon: MessageCircleHeart },
      { label: "সবার অবস্থান", href: "/dashboard/leaderboard", icon: Trophy },
      { label: "৪০ দিনের মেয়াদ", href: "/dashboard/cycles", icon: RefreshCcw },
    ],
  },
  {
    title: "উস্তাদ প্যানেল",
    roles: ["USTADH", "ADMIN"],
    items: [
      { label: "সদস্যদের আজকের অবস্থা", href: "/dashboard/ustad", icon: UsersRound },
      { label: "সদস্যদের বার্তা", href: "/dashboard/ustad/messages", icon: Inbox },
      { label: "সদস্যদের আমলনামা", href: "/dashboard/amalnama/list", icon: NotebookPen },
      { label: "মতামত লিখুন", href: "/dashboard/ustad/reviews", icon: MessageCircleHeart },
      { label: "নোটিশ দিন", href: "/dashboard/ustad/notices", icon: Megaphone },
      { label: "আমলের তালিকা", href: "/dashboard/amal-items", icon: ListChecks },
    ],
  },
  {
    title: "অ্যাডমিন",
    roles: ["ADMIN"],
    items: [
      { label: "সারসংক্ষেপ", href: "/dashboard/admin", icon: ShieldCheck },
      { label: "ব্যবহারকারী", href: "/dashboard/admin/members", icon: Users },
      { label: "মেয়াদ (সাইকেল)", href: "/dashboard/admin/cycles", icon: RefreshCcw },
      { label: "সেটিংস", href: "/dashboard/admin/settings", icon: Settings },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "হোম", href: "/dashboard", icon: Home },
  { label: "আজকের আমল", href: "/dashboard/amalnama", icon: ClipboardCheck },
  { label: "কুরআন", href: "/quran", icon: BookOpenCheck },
  { label: "হাদীস", href: "/dashboard/hadith", icon: BookMarked },
];

const ALL_HREFS = [...new Set(NAV_GROUPS.flatMap((group) => group.items.map((item) => item.href)))];

/** Longest matching href wins, so nested routes never light up two items. */
function isActive(pathname: string, href: string) {
  const matches = ALL_HREFS.filter((h) => (h === "/dashboard" ? pathname === h : pathname === h || pathname.startsWith(`${h}/`)));
  if (!matches.includes(href)) return false;
  return matches.reduce((longest, h) => (h.length > longest.length ? h : longest), matches[0]) === href;
}

function visibleGroups(role: Role) {
  return NAV_GROUPS.filter((group) => !group.roles || group.roles.includes(role));
}

function NavList({ role, onNavigate }: { role: Role; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="মূল নেভিগেশন" className="space-y-5">
      {visibleGroups(role).map((group, index) => (
        <div key={group.title ?? index}>
          {group.title ? (
            <p className="mb-1.5 px-3 text-[11px] font-bold tracking-wider text-subtle-foreground">{group.title}</p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft font-semibold text-primary-soft-foreground"
                      : "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

/** Desktop sidebar body. */
export function DashboardNav({ role }: { role: Role }) {
  return <NavList role={role} />;
}

/**
 * Phone navigation: four primary tabs + "আরও" which opens a full-height
 * sheet with every section the role can reach (and sign-out / theme).
 */
export function MobileBottomNav({ role, name, roleLabel }: { role: Role; name: string; roleLabel: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const moreActive = !BOTTOM_ITEMS.some((item) => isActive(pathname, item.href));

  return (
    <>
      <nav
        aria-label="নিচের নেভিগেশন"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {BOTTOM_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors",
                    active ? "text-primary" : "text-subtle-foreground",
                  )}
                >
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-primary-soft")}>
                    <item.icon className={cn("size-5", active && "stroke-[2.3]")} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              className={cn(
                "flex min-h-[60px] w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold",
                moreActive ? "text-primary" : "text-subtle-foreground",
              )}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", moreActive && "bg-primary-soft")}>
                <Menu className="size-5" />
              </span>
              আরও
            </button>
          </li>
        </ul>
      </nav>

      <ResponsiveSheet open={open} onClose={() => setOpen(false)} title={name} description={roleLabel} className="lg:hidden">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-muted px-3 py-2">
          <span className="text-sm font-medium text-muted-foreground">থিম</span>
          <ThemeToggle />
        </div>
        <NavList role={role} onNavigate={() => setOpen(false)} />
        <div className="mt-4 border-t pt-3">
          <SignOutButton />
        </div>
      </ResponsiveSheet>
    </>
  );
}
