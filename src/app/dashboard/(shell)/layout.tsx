import { Role } from "@prisma/client";
import { Sparkles } from "lucide-react";

import { Brand } from "@/components/brand";
import { DashboardNav, MobileBottomNav, MobileMenu } from "@/components/layout/dashboard-nav";
import { formatBanglaDate, formatHijriDate } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";

const roleLabels: Record<Role, string> = {
  MEMBER: "সদস্য",
  USTADH: "উস্তাদজি",
  ADMIN: "অ্যাডমিন",
};

/** Sticky identity chip pinned to the bottom of the desktop sidebar. */
function UserChip({ name, role }: { name: string; role: Role }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-2.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-900 text-sm font-bold text-amber-300">
        {name.trim().slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-emerald-950">{name}</span>
        <span className="mt-0.5 block truncate text-[11px] font-medium text-stone-500">{roleLabels[role]}</span>
      </span>
    </div>
  );
}

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const role = session.user.role as Role;
  const today = new Date();

  return (
    <div className="canvas-warm min-h-dvh bg-background">
      {/* Keyboard users land here first. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-emerald-900 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-md"
      >
        মূল কন্টেন্টে যান
      </a>

      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-hairline bg-surface lg:flex xl:w-64">
        <div className="px-2 pt-5">
          <Brand />
        </div>

        {/* Scrolls on its own so the identity chip never leaves the fold. */}
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
          <DashboardNav role={role} />
        </div>

        <div className="shrink-0 border-t border-hairline bg-surface p-3">
          <UserChip name={session.user.name} role={role} />
        </div>
      </aside>

      {/* ── Mobile top bar (compact, never jumps while scrolling) ───── */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Brand compact />
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 sm:inline-flex">
              <Sparkles className="size-3 text-amber-600" />
              {formatHijriDate(today)}
            </span>
            <MobileMenu role={role} name={session.user.name} />
          </div>
        </div>
      </header>

      {/* ── Desktop top bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-hairline bg-surface/95 px-8 backdrop-blur lg:ml-60 lg:flex xl:ml-64">
        <div className="flex items-center gap-3 text-xs font-semibold text-emerald-900">
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
            <Sparkles className="size-3 text-amber-600" /> {formatHijriDate(today)}
          </span>
          <span className="text-stone-400">•</span>
          <span className="text-stone-600">{formatBanglaDate(today)}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-900 text-xs font-bold text-amber-300">
              {session.user.name.trim().slice(0, 1)}
            </span>
            {session.user.name}
          </span>
        </div>
      </header>

      {/* ── Content (20px gutters on mobile, never wider) ───────────── */}
      <main
        id="main-content"
        className="px-5 pb-28 pt-5 sm:pb-32 lg:ml-60 lg:px-8 lg:pb-10 lg:pt-8 xl:ml-64"
      >
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>

      {/* ── Mobile bottom navigation (app style) ────────────────────── */}
      <MobileBottomNav />
    </div>
  );
}
