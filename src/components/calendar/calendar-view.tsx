"use client";

import { Moon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import {
  banglaCalendarDate,
  bn,
  dayNotes,
  EVENT_INFO,
  EVENT_TONES,
  formatGregorian,
  formatHijri,
  GREGORIAN_MONTHS_BN,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_BN,
  WEEK_HEADERS_BN,
  WEEKDAYS_BN,
  type CalendarDay,
  type CalendarMonth,
  type EventKind,
} from "@/lib/hijri";
import { cn } from "@/lib/utils";

const MINOR: EventKind[] = ["bid", "monThu"];
const majorOf = (day: CalendarDay) => day.events.find((event) => !MINOR.includes(event));

function WeekHeader({ large }: { large?: boolean }) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEK_HEADERS_BN.map((label, index) => (
        <div
          key={label}
          className={cn(
            "pb-1 text-center font-semibold",
            large ? "text-xs sm:text-sm" : "text-[11px]",
            index === 6 ? "text-cat-jumuah" : "text-subtle-foreground",
          )}
        >
          {label}
        </div>
      ))}
    </div>
  );
}

function Dots({ events, className }: { events: EventKind[]; className?: string }) {
  if (!events.length) return <span aria-hidden className={className} />;
  return (
    <span className={cn("flex items-center justify-center gap-0.5", className)}>
      {events.slice(0, 3).map((event) => (
        <span key={event} className={cn("size-1.5 rounded-full", EVENT_TONES[event].dot)} />
      ))}
    </span>
  );
}

function DayCell({ day, todayIso, large, onSelect }: { day: CalendarDay; todayIso: string; large?: boolean; onSelect: (day: CalendarDay) => void }) {
  const isToday = day.iso === todayIso;
  const major = majorOf(day);
  const isFriday = day.weekday === 5;
  const showMonth = day.g.d === 1;
  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      style={{ gridColumnStart: day.h.d === 1 ? day.col + 1 : undefined }}
      aria-label={`${formatHijri(day.h)}, ${formatGregorian(day.g)}`}
      className={cn(
        "relative flex flex-col items-center rounded-xl border border-transparent transition active:scale-95",
        large ? "h-[4.5rem] justify-start gap-0.5 pt-2 sm:h-24 sm:items-start sm:px-2.5" : "h-[3.25rem] justify-center gap-[3px]",
        isToday
          ? "bg-primary text-primary-foreground shadow-md"
          : major
            ? EVENT_TONES[major].soft
            : day.h.m === 9
              ? "bg-primary-soft/50 hover:bg-primary-soft"
              : "hover:bg-accent",
        !isToday && isFriday && !major && "bg-cat-jumuah/[0.06]",
      )}
    >
      <span
        className={cn(
          "font-semibold leading-none tabular-nums",
          large ? "text-lg sm:text-2xl" : "text-[15px]",
          !isToday && !major && isFriday && "text-cat-jumuah",
        )}
      >
        {bn(day.h.d)}
      </span>
      <span className={cn("leading-none tabular-nums", large ? "text-[10px] sm:text-xs" : "text-[9px]", isToday ? "text-primary-foreground/80" : "text-subtle-foreground")}>
        {bn(day.g.d)}
        {large && showMonth ? ` ${GREGORIAN_MONTHS_BN[day.g.m - 1].slice(0, 3)}` : ""}
      </span>
      {large && major ? (
        <span className="mt-auto hidden w-full truncate pb-1.5 text-left text-[11px] font-semibold sm:block">{EVENT_INFO[major].short}</span>
      ) : null}
      <Dots
        events={isToday ? day.events : day.events.filter((event) => event !== major)}
        className={cn("h-1.5", large && "absolute inset-x-0 bottom-1.5 sm:hidden")}
      />
    </button>
  );
}

function MonthGrid({ month, todayIso, large, onSelect }: { month: CalendarMonth; todayIso: string; large?: boolean; onSelect: (day: CalendarDay) => void }) {
  return (
    <div>
      <WeekHeader large={large} />
      <div className="grid grid-cols-7 gap-1">
        {month.days.map((day) => (
          <DayCell key={day.iso} day={day} todayIso={todayIso} large={large} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function DaySheet({ day, onClose }: { day: CalendarDay | null; onClose: () => void }) {
  const notes = day ? dayNotes(day.h, day.weekday) : [];
  const hasNight = day?.events.some((event) => EVENT_INFO[event].night);
  return (
    <ResponsiveSheet open={Boolean(day)} onClose={onClose} title={day ? `${bn(day.h.d)} ${HIJRI_MONTHS_BN[day.h.m - 1]}` : ""} description={day ? `${WEEKDAYS_BN[day.weekday]}, ${formatGregorian(day.g)}` : undefined}>
      {day ? (
        <div className="space-y-5">
          <div className="hero-surface overflow-hidden rounded-2xl p-5 text-center">
            <p dir="rtl" className="quran-text text-gradient-gold text-3xl leading-[1.7]">
              {HIJRI_MONTHS_AR[day.h.m - 1]}
            </p>
            <p className="mt-1 text-2xl font-bold">{formatHijri(day.h)}</p>
            <p className="mt-2 text-sm text-on-hero-muted">
              {WEEKDAYS_BN[day.weekday]} • {formatGregorian(day.g)}
            </p>
            <p className="text-sm text-on-hero-muted">বাংলা: {banglaCalendarDate(day.g)}</p>
          </div>

          {day.events.length ? (
            <div className="space-y-2.5">
              <p className="text-sm font-semibold text-muted-foreground">এই দিনের গুরুত্ব</p>
              {day.events.map((event) => (
                <div key={event} className="flex gap-3 rounded-xl border bg-card p-3.5">
                  <span className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", EVENT_TONES[event].dot)} />
                  <div>
                    <p className="font-semibold">{EVENT_INFO[event].label}</p>
                    <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{EVENT_INFO[event].description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">এই দিনে বিশেষ কোনো তারিখ নেই।</p>
          )}

          {notes.length ? (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li key={note} className="flex gap-2.5 text-sm leading-6">
                  <Sparkles className="mt-1 size-4 shrink-0 text-gold" />
                  {note}
                </li>
              ))}
            </ul>
          ) : null}

          {hasNight ? (
            <p className="flex gap-2.5 rounded-xl bg-info-soft px-4 py-3 text-sm leading-6 text-info">
              <Moon className="mt-1 size-4 shrink-0" />
              ইসলামি দিন মাগরিব থেকে শুরু হয় — এই রাতটি আগের দিনের সন্ধ্যা থেকে শুরু।
            </p>
          ) : null}
        </div>
      ) : null}
    </ResponsiveSheet>
  );
}

/** Year view: 12 compact month cards. */
export function YearCalendar({ months, todayIso, year }: { months: CalendarMonth[]; todayIso: string; year: number }) {
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => {
          const isCurrent = month.days.some((day) => day.iso === todayIso);
          return (
            <section
              key={month.month}
              id={`m-${month.month}`}
              className={cn("scroll-mt-24 rounded-card border bg-card p-4 shadow-card", isCurrent && "border-primary/50 ring-2 ring-primary/20")}
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/calendar?year=${year}&view=month&m=${month.month}`} className="flex items-center gap-2 hover:text-primary">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary-soft-foreground">{bn(month.month)}</span>
                    <h3 className="truncate text-base font-semibold">{HIJRI_MONTHS_BN[month.month - 1]}</h3>
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {month.gregorianLabel} • {bn(month.days.length)} দিন
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span dir="rtl" className="arabic-text text-base leading-none text-gold-foreground">
                    {HIJRI_MONTHS_AR[month.month - 1]}
                  </span>
                  {isCurrent ? <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">চলতি মাস</span> : null}
                </div>
              </header>
              <MonthGrid month={month} todayIso={todayIso} onSelect={setSelected} />
            </section>
          );
        })}
      </div>
      <DaySheet day={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/** Month view: one month with large cells and event labels. */
export function MonthCalendar({ month, todayIso }: { month: CalendarMonth; todayIso: string }) {
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const events = month.days.filter((day) => majorOf(day));
  return (
    <>
      <section className="rounded-card border bg-card p-3 shadow-card sm:p-5">
        <MonthGrid month={month} todayIso={todayIso} large onSelect={setSelected} />
      </section>
      {events.length ? (
        <section className="mt-4 rounded-card border bg-card p-4 shadow-card">
          <h3 className="mb-3 font-semibold">এই মাসের গুরুত্বপূর্ণ দিন</h3>
          <ul className="divide-y">
            {events.map((day) => {
              const major = majorOf(day)!;
              return (
                <li key={day.iso}>
                  <button type="button" onClick={() => setSelected(day)} className="flex w-full items-center gap-3 py-2.5 text-left">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold", EVENT_TONES[major].soft)}>{bn(day.h.d)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{EVENT_INFO[major].label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {WEEKDAYS_BN[day.weekday]}, {formatGregorian(day.g)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <DaySheet day={selected} onClose={() => setSelected(null)} />
    </>
  );
}
