"use client";

import { CalendarHeart, Moon, ShieldAlert, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

import { PrayerLocationButton } from "@/components/prayer/prayer-location-picker";
import { clockBn, dhakaNowMinutes, getForbiddenWindows } from "@/lib/forbidden-times";
import { isDhaka } from "@/lib/prayer-location";
import { useLocationTimings, usePrayerLocation } from "@/lib/use-prayer-location";
import { daysLeftLabel, EVENT_INFO, EVENT_TONES, formatHijri, todayInDhaka, upcomingEvents, type UpcomingEvent } from "@/lib/hijri";
import type { PrayerTiming } from "@/lib/prayer-times";
import { cn } from "@/lib/utils";

type Props = {
  timings: PrayerTiming;
  hijriDate: string;
  banglaDate: string;
  englishDate?: string;
  /** Tighter layout for the dashboard home (no big date header). */
  compact?: boolean;
  className?: string;
};

type WaqtKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

/**
 * Current waqt: from its start until the next one begins. Between sunrise and
 * dhuhr there is no fard waqt (null). Before fajr it is still isha.
 */
function getActiveWaqt(m: PrayerTiming["minutes"], now: number): WaqtKey | null {
  if (now >= m.isha || now < m.fajr) return "isha";
  if (now < m.sunrise) return "fajr";
  if (now < m.dhuhr) return null;
  if (now < m.asr) return "dhuhr";
  if (now < m.maghrib) return "asr";
  return "maghrib";
}

function getNextWaqt(m: PrayerTiming["minutes"], now: number): { key: WaqtKey; inMinutes: number } {
  const order: WaqtKey[] = ["fajr", "dhuhr", "asr", "maghrib", "isha"];
  for (const key of order) if (m[key] > now) return { key, inMinutes: m[key] - now };
  return { key: "fajr", inMinutes: 24 * 60 - now + m.fajr };
}

const bn = new Intl.NumberFormat("bn-BD");
function toBnTime(value: string) {
  return value.replace(/\d+/g, (digits) => bn.format(Number(digits)).padStart(digits.length === 2 ? 2 : 1, "০")).replace("AM", "এএম").replace("PM", "পিএম");
}
function durationBn(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${bn.format(hours)} ঘণ্টা ${bn.format(rest)} মিনিট` : `${bn.format(rest)} মিনিট`;
}

const LABELS: Record<WaqtKey, string> = { fajr: "ফজর", dhuhr: "যোহর", asr: "আসর", maghrib: "মাগরিব", isha: "এশা" };

export function TodayPrayerCard({ timings: initialTimings, hijriDate, banglaDate, compact = false, className }: Props) {
  const { timings: located, loading, failed } = useLocationTimings(initialTimings);
  const location = usePrayerLocation();
  const timings = located ?? initialTimings;
  const [now, setNow] = useState<number | null>(null);
  const [event, setEvent] = useState<UpcomingEvent | null>(null);

  useEffect(() => {
    const update = () => {
      setNow(dhakaNowMinutes());
      setEvent(upcomingEvents(todayInDhaka()).find((entry) => entry.kind !== "bid") ?? null);
    };
    update();
    const interval = window.setInterval(update, 30000);
    return () => window.clearInterval(interval);
  }, [location.tz]);

  // Never show Dhaka's times under another place's name while those are still loading / failed.
  if (!located && !isDhaka(location)) {
    return (
      <section id="today" className={cn("surface w-full rounded-card p-5 sm:p-6", className)} aria-label="আজকের নামাজের সময়" aria-busy={loading}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">আজকের নামাজের সময়</h2>
          <PrayerLocationButton />
        </div>
        <p role="status" className="mt-6 pb-4 text-center text-sm text-muted-foreground">
          {failed ? "এই অবস্থানের সময় আনা যায়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন বা অন্য শহর বেছে নিন।" : `${location.name} এর সময় লোড হচ্ছে…`}
        </p>
      </section>
    );
  }

  const active = now === null ? null : getActiveWaqt(timings.minutes, now);
  const forbidden = getForbiddenWindows(timings.minutes);
  const activeForbidden = now === null ? null : forbidden.find((window) => now >= window.start && now < window.end) ?? null;
  const next = now === null ? null : getNextWaqt(timings.minutes, now);
  const prayers: Array<{ key: WaqtKey; time: string; icon: typeof Sun }> = [
    { key: "fajr", time: timings.fajr, icon: Sunrise },
    { key: "dhuhr", time: timings.dhuhr, icon: Sun },
    { key: "asr", time: timings.asr, icon: Sun },
    { key: "maghrib", time: timings.maghrib, icon: Sunset },
    { key: "isha", time: timings.isha, icon: Moon },
  ];
  const eventTone = event ? EVENT_TONES[event.kind] : null;

  return (
    <section
      id="today"
      className={cn("surface glow-border relative w-full overflow-hidden rounded-card bg-linear-to-br from-primary-soft via-card to-gold-soft p-4 sm:p-6", className)}
      aria-label="আজকের নামাজের সময়"
      aria-busy={loading}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {compact ? (
            <h2 className="text-base font-bold text-foreground">আজকের নামাজের সময়</h2>
          ) : (
            <>
              <p className="inline-flex items-center gap-1.5 rounded-md bg-primary/12 px-2.5 py-1 text-xs font-bold text-primary">
                <Moon className="size-3.5" /> {hijriDate}
              </p>
              <p className="mt-2.5 text-2xl font-bold leading-tight text-foreground sm:text-[1.7rem]">{banglaDate}</p>
            </>
          )}
          {next ? (
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              পরবর্তী ওয়াক্ত: <b className="text-primary">{LABELS[next.key]}</b> — {durationBn(next.inMinutes)} পর
            </p>
          ) : null}
        </div>
        <PrayerLocationButton />
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
        {prayers.map(({ key, time, icon: Icon }) => {
          const isActive = active === key;
          return (
            <div
              key={key}
              className={cn(
                "rounded-lg px-1 py-2.5 text-center ring-1 transition-colors",
                isActive ? "bg-active text-on-active shadow-md ring-transparent" : "bg-card text-foreground ring-hairline",
              )}
            >
              <Icon className={cn("mx-auto size-4", isActive ? "text-on-active" : "text-primary")} />
              <p className="mt-1 text-xs font-bold sm:text-sm">{LABELS[key]}</p>
              <p className="mt-0.5 text-xs font-semibold tabular-nums sm:text-sm">{toBnTime(time.replace(/ (AM|PM)$/, ""))}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-1.5 text-center sm:gap-2">
        {[
          { label: "সেহরি শেষ", value: timings.sahariEnd, tone: "bg-info/10 text-info" },
          { label: "সূর্যোদয়", value: timings.sunrise, tone: "bg-warning/12 text-warning" },
          { label: "ইফতার", value: timings.iftar, tone: "bg-cat-service/12 text-cat-service" },
        ].map((row) => (
          <div key={row.label} className={cn("rounded-lg px-2 py-2.5", row.tone)}>
            <p className="text-xs font-medium opacity-90">{row.label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{toBnTime(row.value)}</p>
          </div>
        ))}
      </div>

      {event && eventTone ? (
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-gold-soft px-3 py-2.5 ring-1 ring-gold/25">
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", eventTone.soft)}>
            <CalendarHeart className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{EVENT_INFO[event.kind].label}</p>
            <p className="truncate text-xs text-muted-foreground">{formatHijri(event.h)}</p>
          </div>
          <span className="shrink-0 rounded-md bg-gold/15 px-2.5 py-1 text-xs font-bold text-gold-foreground">{daysLeftLabel(event.daysLeft)}</span>
        </div>
      ) : null}

      {/* ── নিষিদ্ধ সময় (আনুমানিক): লালচে কার্ড; চলতি সময়ের টাইল গাঢ় লাল ── */}
      <div className="mt-2 rounded-lg bg-danger-soft p-3 ring-1 ring-danger/25">
        <p className="flex items-center gap-1.5 text-xs font-bold text-foreground">
          <ShieldAlert className={cn("size-4 text-danger", activeForbidden && "animate-pulse")} /> নামাজের নিষিদ্ধ সময়
          <span className="font-medium text-muted-foreground">(আনুমানিক)</span>
        </p>
        <ul className="mt-2.5 grid grid-cols-1 gap-1.5 min-[400px]:grid-cols-3 sm:gap-2">
          {forbidden.map((window) => {
            const isNow = activeForbidden?.key === window.key;
            return (
              <li
                key={window.key}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors duration-500 min-[400px]:flex-col min-[400px]:items-start min-[400px]:gap-0.5",
                  isNow ? "bg-linear-to-br from-[#d32f2f] to-[#8f1f24] text-white shadow-md ring-1 ring-white/25" : "bg-danger/10 text-foreground",
                )}
              >
                <span className={cn("text-xs font-semibold", isNow ? "text-white/90" : "text-muted-foreground")}>{window.label.replace(/ (যাওয়াল)$/, "")}</span>
                <span className="text-sm font-bold tabular-nums">
                  {clockBn(window.start)}–{clockBn(window.end)}
                </span>
              </li>
            );
          })}
        </ul>
        {activeForbidden && now !== null ? (
          <p className="mt-2.5 flex items-center gap-2 text-sm font-bold text-foreground" role="status">
            <span aria-hidden className="size-2 shrink-0 animate-pulse rounded-full bg-[#e53935]" />
            এখন নিষিদ্ধ সময় — {durationBn(activeForbidden.end - now)} বাকি
          </p>
        ) : null}
      </div>
      {timings.source === "fallback" ? <p className="mt-2 text-xs text-muted-foreground">লাইভ সময় পাওয়া যায়নি — আনুমানিক সময় দেখানো হচ্ছে।</p> : null}
    </section>
  );
}
