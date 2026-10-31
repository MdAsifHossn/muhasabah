import { Role } from "@prisma/client";

import { Brand } from "@/components/brand";
import { DashboardNav, MobileBottomNav } from "@/components/layout/dashboard-nav";
import { ShareButton } from "@/components/layout/share-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { roleLabels } from "@/lib/constants";
import { formatBanglaDate, formatHijriDate } from "@/lib/dates";
import { isStaffRole, requireUser } from "@/lib/permissions";

function Avatar({ name, className = "size-9 text-sm" }: { name: string; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-full bg-primary font-bold text-on-primary ${className}`}>
      {name.trim().slice(0, 1)}
    </span>
  );
}

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const role = session.user.role as Role;
  const today = new Date();
  const roleLabel = roleLabels[role];

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-on-primary"
      >
        মূল কন্টেন্টে যান
      </a>

      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-hairline bg-surface lg:flex">
        <div className="px-5 pt-5">
          <Brand href="/dashboard" />
        </div>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
          <DashboardNav role={role} />
        </div>
        <div className="shrink-0 space-y-1 border-t border-hairline p-3">
          <div className="flex items-center gap-3 rounded-xl bg-surface-sunken px-3 py-2.5">
            <Avatar name={session.user.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">{session.user.name}</span>
              <span className="block truncate text-[11px] font-medium text-muted-foreground">{roleLabel}</span>
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Top bar (mobile + desktop) ── */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:ml-64">
        <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:h-16 lg:px-8">
          <div className="lg:hidden">
            <Brand href="/dashboard" />
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold lg:flex">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-primary-soft-foreground">{formatHijriDate(today)}</span>
            <span className="text-muted-foreground">{formatBanglaDate(today)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton />
            <ThemeToggle className="hidden sm:grid" />
            <UserMenu name={session.user.name} email={session.user.email} roleLabel={roleLabel} isStaff={isStaffRole(role)} />
          </div>
        </div>
      </header>

      <main id="main-content" className="px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:ml-64 lg:px-8 lg:pb-12 lg:pt-8">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>

      <MobileBottomNav role={role} name={session.user.name} roleLabel={roleLabel} />
    </div>
  );
}
