import { Role } from "@prisma/client";
import { Menu, Sparkles } from "lucide-react";

import { Brand } from "@/components/brand";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { formatBanglaDate, formatHijriDate } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const isAdmin = session.user.role === Role.ADMIN;
  const today = new Date();
  const banglaDate = formatBanglaDate(today);
  const hijriDate = formatHijriDate(today);

  return (
    <div className="min-h-screen bg-stone-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 overflow-y-auto border-r border-stone-200 bg-white p-5 lg:block">
        <Brand />
        <div className="mt-8">
          <DashboardNav isAdmin={isAdmin} />
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-5 backdrop-blur lg:ml-64 lg:px-8">
        <div className="lg:hidden">
          <Brand />
        </div>
        <div className="hidden items-center gap-3 text-xs font-semibold text-emerald-900 sm:flex">
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-800">
            <Sparkles className="size-3 text-amber-600" /> {hijriDate}
          </span>
          <span className="text-stone-400">•</span>
          <span className="text-stone-600">{banglaDate}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <p className="text-sm font-medium text-stone-700">{session.user.name}</p>
          <details className="relative lg:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-stone-200 text-stone-600">
              <Menu className="size-5" />
            </summary>
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl">
              <DashboardNav isAdmin={isAdmin} compact />
            </div>
          </details>
        </div>
      </header>
      <main className="px-5 py-8 lg:ml-64 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}