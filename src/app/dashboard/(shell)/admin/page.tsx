import { CycleStatus, DailyEntryStatus, Gender, Role } from "@prisma/client";
import { CalendarCheck2, ClipboardCheck, ListChecks, Megaphone, RefreshCcw, Settings, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { StatTile } from "@/components/design/stat-tile";
import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/constants";
import { getActiveCycle, getCycleProgress } from "@/lib/cycles";
import { formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "অ্যাডমিন ওভারভিউ" };

const n = (value: number) => value.toLocaleString("bn-BD");

export default async function AdminOverviewPage() {
  await requireAdmin();
  const cycle = await getActiveCycle();
  const today = startOfBangladeshDay(getBangladeshToday());

  const [byRoleGender, inactive, activeItems, notices, draftCycles, todayEntries, newestUsers] = await Promise.all([
    prisma.user.groupBy({ by: ["role", "gender"], where: { isActive: true }, _count: { _all: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.amalItem.count({ where: { isActive: true } }),
    prisma.announcement.count(),
    prisma.cycle.count({ where: { status: CycleStatus.DRAFT } }),
    cycle
      ? prisma.dailyAmalEntry.findMany({
          where: { cycleId: cycle.id, date: today, user: { hideAmalnama: false } },
          select: { status: true, completionPercentage: true },
        })
      : Promise.resolve([]),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, role: true, gender: true, createdAt: true } }),
  ]);

  const count = (role?: Role, gender?: Gender) =>
    byRoleGender.filter((row) => (!role || row.role === role) && (!gender || row.gender === gender)).reduce((sum, row) => sum + row._count._all, 0);
  const submitted = todayEntries.filter((entry) => entry.status !== DailyEntryStatus.DRAFT);
  const todayAverage = submitted.length ? Math.round(submitted.reduce((sum, entry) => sum + entry.completionPercentage, 0) / submitted.length) : 0;
  const progress = cycle ? getCycleProgress(cycle.startDate, cycle.endDate, today) : null;
  const unsetGender = count(undefined, Gender.OTHER);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader eyebrow="অ্যাডমিন" title="অ্যাডমিন ওভারভিউ" description={`${formatBanglaDate(today)} — ব্যবহারকারী, সাইকেল ও আজকের আমলনামার সারসংক্ষেপ।`} />

      {cycle && progress ? (
        <section className="hero-surface rounded-card p-5 shadow-raised sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-on-hero-muted">সক্রিয় সাইকেল</p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl">{cycle.title}</h2>
              <p className="mt-1 text-sm text-on-hero-muted">
                {formatBanglaDate(cycle.startDate)} — {formatBanglaDate(cycle.endDate)} • {n(progress.day)}/{n(progress.totalDays)} দিন
              </p>
            </div>
            <p className="text-4xl font-bold tabular-nums text-amber-300">{n(progress.percentage)}%</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-amber-300" style={{ width: `${progress.percentage}%` }} />
          </div>
        </section>
      ) : (
        <EmptyState
          icon={RefreshCcw}
          title="কোনো সক্রিয় সাইকেল নেই"
          description={draftCycles ? `${n(draftCycles)}টি খসড়া সাইকেল আছে — সক্রিয় করুন।` : "সদস্যরা আমলনামা পূরণ করতে পারবেন না যতক্ষণ না একটি সাইকেল সক্রিয় হয়।"}
          action={
            <Link href="/dashboard/admin/cycles" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary">
              সাইকেল ব্যবস্থাপনা
            </Link>
          }
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile label="সক্রিয় সদস্য" value={n(count(Role.MEMBER))} note={`ভাই ${n(count(Role.MEMBER, Gender.MALE))} • বোন ${n(count(Role.MEMBER, Gender.FEMALE))}`} icon={UsersRound} />
        <StatTile label="উস্তাদজি / অ্যাডমিন" value={`${n(count(Role.USTADH))} / ${n(count(Role.ADMIN))}`} note={`নিষ্ক্রিয় অ্যাকাউন্ট ${n(inactive)}`} icon={ShieldCheck} tone="gold" />
        <StatTile label="আজ জমা" value={n(submitted.length)} note={`খসড়া ${n(todayEntries.length - submitted.length)} • গড় ${n(todayAverage)}%`} icon={ClipboardCheck} progress={todayAverage} />
        <StatTile label="চালু আমল / নোটিশ" value={`${n(activeItems)} / ${n(notices)}`} note="আমল আইটেম ও নোটিশ" icon={ListChecks} tone="info" />
      </div>

      {unsetGender ? (
        <Link href="/dashboard/admin/members" className="block rounded-card bg-warning-soft px-4 py-3 text-sm leading-6 text-warning">
          {n(unsetGender)} জন সক্রিয় ব্যবহারকারীর লিঙ্গ নির্ধারিত নেই — তারা পুরুষ/নারীর আলাদা আমল পাচ্ছেন না। ঠিক করতে এখানে চাপুন →
        </Link>
      ) : null}

      <nav aria-label="দ্রুত কাজ" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { href: "/dashboard/admin/members", label: "নতুন ব্যবহারকারী", icon: UserPlus },
          { href: "/dashboard/admin/cycles", label: "সাইকেল", icon: RefreshCcw },
          { href: "/dashboard/ustad", label: "তত্ত্বাবধান", icon: CalendarCheck2 },
          { href: "/dashboard/amal-items", label: "আমল আইটেম", icon: ListChecks },
          { href: "/dashboard/ustad/notices", label: "নোটিশ", icon: Megaphone },
          { href: "/dashboard/admin/settings", label: "সেটিংস", icon: Settings },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="surface flex flex-col items-center gap-2 rounded-card p-3 text-center text-[13px] font-semibold text-foreground transition hover:border-hairline-strong active:scale-[0.98]">
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <item.icon className="size-5" />
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <section className="surface rounded-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground">নতুন যোগ দেওয়া</h2>
          <Link href="/dashboard/admin/members" className="text-sm font-semibold text-primary">
            সবাই →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-hairline">
          {newestUsers.map((user) => (
            <li key={user.id} className="flex items-center gap-3 py-2.5">
              <span className={user.gender === Gender.FEMALE ? "grid size-9 place-items-center rounded-full bg-female-soft text-sm font-bold text-female" : "grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary"}>
                {user.name.trim().slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span>
                <span className="block text-[11px] text-muted-foreground">{formatBanglaDate(user.createdAt)}</span>
              </span>
              <Badge variant={user.role === Role.ADMIN ? "gold" : user.role === Role.USTADH ? "info" : "secondary"}>{roleLabels[user.role]}</Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
