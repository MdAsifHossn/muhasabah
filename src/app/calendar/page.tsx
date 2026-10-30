import { CalendarDays, ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { MonthCalendar, YearCalendar } from "@/components/calendar/calendar-view";
import {
  banglaCalendarDate,
  bn,
  buildHijriYear,
  daysLeftLabel,
  EVENT_INFO,
  EVENT_TONES,
  formatGregorian,
  gIso,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_BN,
  LEGEND,
  todayInDhaka,
  toHijri,
  upcomingEvents,
  WEEKDAYS_BN,
  gWeekday,
} from "@/lib/hijri";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "হিজরি ক্যালেন্ডার",
  description: "১২ মাসের হিজরি ক্যালেন্ডার — গুরুত্বপূর্ণ দিন, আইয়ামে বীজ ও সুন্নাত রোজার দিনসহ।",
};

const MIN_YEAR = 1400;
const MAX_YEAR = 1500;

function clampInt(value: string | undefined, min: number, max: number, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ year?: string; view?: string; m?: string }> }) {
  const params = await searchParams;
  const today = todayInDhaka();
  const todayH = toHijri(today);
  const todayIso = gIso(today);

  const year = clampInt(params.year, MIN_YEAR, MAX_YEAR, todayH.y);
  const view = params.view === "month" ? "month" : "year";
  const month = clampInt(params.m, 1, 12, year === todayH.y ? todayH.m : 1);
  const months = buildHijriYear(year);
  const upcoming = upcomingEvents(today);
  // Hero shows the next major day; the monthly আইয়ামে বীজ stays in the list.
  const next = upcoming.find((event) => event.kind !== "bid") ?? upcoming[0];

  const prevMonth = month === 1 ? { year: year - 1, m: 12 } : { year, m: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, m: 1 } : { year, m: month + 1 };
  const navBase = "inline-grid size-10 place-items-center rounded-xl border bg-card text-muted-foreground shadow-xs transition hover:text-foreground";

  return (
    <div className="space-y-5">
      {/* ── Today ── */}
      <section className="hero-surface overflow-hidden rounded-[1.75rem] p-5 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-on-hero-muted">
              <CalendarDays className="size-4" /> আজ • {WEEKDAYS_BN[gWeekday(today)]}
            </p>
            <p dir="rtl" className="quran-text text-gradient-gold mt-3 text-left text-3xl leading-[1.6] sm:text-4xl">
              {HIJRI_MONTHS_AR[todayH.m - 1]} {new Intl.NumberFormat("ar-EG", { useGrouping: false }).format(todayH.y)}هـ
            </p>
            <h1 className="mt-1 text-[2rem] font-bold leading-tight sm:text-5xl">
              {bn(todayH.d)} {HIJRI_MONTHS_BN[todayH.m - 1]}
            </h1>
            <p className="mt-1 text-lg font-medium text-on-hero-muted">{bn(todayH.y)} হিজরি</p>
            <p className="mt-3 text-sm text-on-hero-muted">
              {formatGregorian(today)} • {banglaCalendarDate(today)} বঙ্গাব্দ
            </p>
          </div>
          {next ? (
            <div className="rounded-2xl bg-white/[0.08] p-4 ring-1 ring-white/15 backdrop-blur-sm lg:min-w-72">
              <p className="text-xs font-medium text-on-hero-muted">পরবর্তী গুরুত্বপূর্ণ দিন</p>
              <p className="mt-1 text-xl font-bold">{EVENT_INFO[next.kind].label}</p>
              <p className="mt-0.5 text-sm text-on-hero-muted">
                {bn(next.h.d)} {HIJRI_MONTHS_BN[next.h.m - 1]} • {formatGregorian(next.g)}
              </p>
              <p className="mt-3 inline-flex rounded-full bg-[#e3b25a] px-3 py-1 text-sm font-bold text-[#2a1d02]">{daysLeftLabel(next.daysLeft)}</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view === "year" ? (
            <>
              <Link href={`/calendar?year=${year - 1}`} aria-label="আগের বছর" className={cn(navBase, year <= MIN_YEAR && "pointer-events-none opacity-40")}>
                <ChevronLeft className="size-5" />
              </Link>
              <h2 className="min-w-28 text-center text-xl font-bold">{bn(year)} হিজরি</h2>
              <Link href={`/calendar?year=${year + 1}`} aria-label="পরের বছর" className={cn(navBase, year >= MAX_YEAR && "pointer-events-none opacity-40")}>
                <ChevronRight className="size-5" />
              </Link>
            </>
          ) : (
            <>
              <Link href={`/calendar?year=${prevMonth.year}&view=month&m=${prevMonth.m}`} aria-label="আগের মাস" className={navBase}>
                <ChevronLeft className="size-5" />
              </Link>
              <div className="min-w-40 text-center">
                <h2 className="text-xl font-bold leading-tight">{HIJRI_MONTHS_BN[month - 1]}</h2>
                <p className="text-xs text-muted-foreground">
                  {bn(year)} হিজরি{months[month - 1] ? ` • ${months[month - 1].gregorianLabel}` : ""}
                </p>
              </div>
              <Link href={`/calendar?year=${nextMonth.year}&view=month&m=${nextMonth.m}`} aria-label="পরের মাস" className={navBase}>
                <ChevronRight className="size-5" />
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {view === "year" || year !== todayH.y || month !== todayH.m ? (
            <Link
              href={view === "month" ? `/calendar?view=month&m=${todayH.m}` : year === todayH.y ? `#m-${todayH.m}` : `/calendar#m-${todayH.m}`}
              className="inline-flex h-10 items-center rounded-xl border bg-card px-3.5 text-sm font-semibold shadow-xs hover:bg-accent"
            >
              {view === "year" && year === todayH.y ? "চলতি মাস" : "আজ"}
            </Link>
          ) : null}
          <div className="grid h-10 grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold">
            <Link
              href={`/calendar?year=${year}`}
              className={cn("grid place-items-center rounded-lg px-4", view === "year" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >
              বছর
            </Link>
            <Link
              href={`/calendar?year=${year}&view=month&m=${month}`}
              className={cn("grid place-items-center rounded-lg px-4", view === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >
              মাস
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {view === "month" && months[month - 1] ? (
            <MonthCalendar month={months[month - 1]} todayIso={todayIso} />
          ) : (
            <YearCalendar months={months} todayIso={todayIso} year={year} />
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-card border bg-card p-4 shadow-card">
            <h3 className="mb-3 font-semibold">আসন্ন গুরুত্বপূর্ণ দিন</h3>
            <ul className="space-y-2.5">
              {upcoming.map((event) => (
                <li key={event.kind} className="flex items-center gap-3">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold", EVENT_TONES[event.kind].soft)}>{bn(event.h.d)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{EVENT_INFO[event.kind].label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {HIJRI_MONTHS_BN[event.h.m - 1]} • {formatGregorian(event.g)}
                    </span>
                  </span>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", event.daysLeft <= 7 ? "bg-gold-soft text-gold-foreground" : "bg-muted text-muted-foreground")}>
                    {daysLeftLabel(event.daysLeft)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-card border bg-card p-4 shadow-card">
            <h3 className="mb-3 font-semibold">চিহ্নের অর্থ</h3>
            <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
              {LEGEND.map((kind) => (
                <li key={kind} className="flex items-center gap-2">
                  <span className={cn("size-2.5 shrink-0 rounded-full", EVENT_TONES[kind].dot)} />
                  <span className="truncate">{EVENT_INFO[kind].short === "সুন্নাত রোজা" ? "সোম/বৃহঃ রোজা" : EVENT_INFO[kind].label}</span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full bg-cat-jumuah/40 ring-1 ring-cat-jumuah" />
                জুমাবার
              </li>
            </ul>
          </section>

          <p className="flex gap-2.5 rounded-card border border-dashed p-4 text-xs leading-5 text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" />
            তারিখগুলো উম্মুল কুরা হিসাব থেকে বাংলাদেশের চাঁদ দেখার সাথে মিলিয়ে (এক দিন পিছিয়ে) দেখানো হয়েছে। চাঁদ দেখার ওপর নির্ভর করে এক দিন কম-বেশি হতে পারে।
          </p>
        </aside>
      </div>
    </div>
  );
}
