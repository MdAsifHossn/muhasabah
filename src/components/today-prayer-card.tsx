"use client";

import { MapPin, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useState } from "react";

import type { PrayerTiming } from "@/lib/prayer-times";
import { cn } from "@/lib/utils";

type Props = {
  timings: PrayerTiming;
  hijriDate: string;
  banglaDate: string;
  englishDate: string;
  /** Tighter layout for the dashboard home (no big date header). */
  compact?: boolean;
  className?: string;
};

type WaqtKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

function getDhakaMinutes(): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

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

export function TodayPrayerCard({ timings, hijriDate, banglaDate, englishDate, compact = false, className }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(getDhakaMinutes());
    update();
    const interval = window.setInterval(update, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const active = now === null ? null : getActiveWaqt(timings.minutes, now);
  const next = now === null ? null : getNextWaqt(timings.minutes, now);
  const prayers: Array<{ key: WaqtKey; time: string; icon: typeof Sun }> = [
    { key: "fajr", time: timings.fajr, icon: Sunrise },
    { key: "dhuhr", time: timings.dhuhr, icon: Sun },
    { key: "asr", time: timings.asr, icon: Sun },
    { key: "maghrib", time: timings.maghrib, icon: Sunset },
    { key: "isha", time: timings.isha, icon: Moon },
  ];

  return (
    <section id="today" className={cn("surface w-full rounded-card p-4 sm:p-6", className)} aria-label="আজকের নামাজের সময়">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {compact ? (
            <h2 className="text-base font-bold text-foreground">আজকের নামাজের সময়</h2>
          ) : (
            <>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-soft-foreground">
                <Moon className="size-3.5" /> {hijriDate}
              </p>
              <p className="mt-2 text-xl font-bold text-foreground sm:text-2xl">{banglaDate}</p>
              <p className="text-xs text-muted-foreground">{englishDate}</p>
            </>
          )}
          {next ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              পরবর্তী ওয়াক্ত: <b className="text-primary">{LABELS[next.key]}</b> — {durationBn(next.inMinutes)} পর
            </p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-sunken px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          <MapPin className="size-3" /> {timings.district}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1.5 sm:gap-2">
        {prayers.map(({ key, time, icon: Icon }) => {
          const isActive = active === key;
          return (
            <div
              key={key}
              className={cn(
                "rounded-xl px-1 py-2.5 text-center transition-colors",
                isActive ? "bg-primary text-on-primary shadow-md" : "bg-surface-sunken text-foreground",
              )}
            >
              <Icon className={cn("mx-auto size-4", isActive ? "text-on-primary" : "text-muted-foreground")} />
              <p className="mt-1 text-[11px] font-bold sm:text-xs">{LABELS[key]}</p>
              <p className="mt-0.5 text-[11px] font-semibold tabular-nums sm:text-sm">{toBnTime(time.replace(/ (AM|PM)$/, ""))}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "সেহরি শেষ", value: timings.sahariEnd },
          { label: "সূর্যোদয়", value: timings.sunrise },
          { label: "ইফতার", value: timings.iftar },
        ].map((row) => (
          <div key={row.label} className="rounded-xl border border-hairline px-2 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">{row.label}</p>
            <p className="text-sm font-bold tabular-nums text-foreground">{toBnTime(row.value)}</p>
          </div>
        ))}
      </div>
      {timings.source === "fallback" ? <p className="mt-2 text-[10px] text-subtle-foreground">লাইভ সময় পাওয়া যায়নি — আনুমানিক সময় দেখানো হচ্ছে।</p> : null}
    </section>
  );
}
