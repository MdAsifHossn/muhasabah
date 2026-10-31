"use client";

import { Moon, ShieldAlert, Sun, Sunrise, Sunset, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

import { clockBn, dhakaNowMinutes, durationBn, FORBIDDEN_NOTE, getForbiddenWindows, getWaqtWindows } from "@/lib/forbidden-times";
import type { PrayerTiming } from "@/lib/prayer-times";
import { cn } from "@/lib/utils";

type Row = { id: string; label: string; start: number; end?: number; kind: "waqt" | "forbidden" | "info"; icon: typeof Sun; hint?: string };

function buildRows(m: PrayerTiming["minutes"]): Row[] {
  const waqtIcons = { fajr: Sunrise, dhuhr: Sun, asr: Sun, maghrib: Sunset, isha: Moon } as const;
  const rows: Row[] = [
    { id: "sahari", label: "সেহরির শেষ সময়", start: m.sahariEnd, kind: "info", icon: UtensilsCrossed },
    ...getWaqtWindows(m).map<Row>((w) => ({ id: w.key, label: w.label, start: w.start, end: w.end, kind: "waqt", icon: waqtIcons[w.key] })),
    { id: "sunrise-at", label: "সূর্যোদয়", start: m.sunrise, kind: "info", icon: Sunrise },
    { id: "ishraq", label: "ইশরাকের সময় শুরু", start: m.ishraq, kind: "info", icon: Sun },
    ...getForbiddenWindows(m).map<Row>((w) => ({ id: `f-${w.key}`, label: `নিষিদ্ধ: ${w.label}`, start: w.start, end: w.end, kind: "forbidden", icon: ShieldAlert, hint: w.note })),
    { id: "iftar", label: "ইফতার", start: m.iftar, kind: "info", icon: UtensilsCrossed },
  ];
  // Same minute: the plain moment (e.g. সূর্যোদয়) before the window it opens.
  const order = { info: 0, waqt: 1, forbidden: 2 } as const;
  return rows.sort((a, b) => a.start - b.start || order[a.kind] - order[b.kind]);
}

/** Whole day at a glance: waqts, sunrise, forbidden windows, sehri/iftar, with "now" and the next event. */
export function PrayerTimeline({ minutes }: { minutes: PrayerTiming["minutes"] }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(dhakaNowMinutes());
    update();
    const interval = window.setInterval(update, 20000);
    return () => window.clearInterval(interval);
  }, []);

  const rows = buildRows(minutes);
  // After the last event of the day, the next one is tomorrow's Fajr.
  const upcoming = now === null ? null : rows.find((row) => row.start > now) ?? null;
  const fajr = rows.find((row) => row.id === "fajr");
  const next = now === null ? null : upcoming ? { ...upcoming, inMinutes: upcoming.start - now } : fajr ? { ...fajr, label: "আগামীকাল ফজর", inMinutes: 24 * 60 - now + fajr.start } : null;

  return (
    <div className="space-y-4">
      <section className="hero-surface rounded-card p-5 sm:p-6">
        <p className="text-xs font-semibold text-on-hero-muted">পরবর্তী</p>
        <p className="mt-1 text-3xl font-bold">{next ? next.label.replace(/^নিষিদ্ধ: /, "নিষিদ্ধ সময় — ") : "…"}</p>
        {next ? (
          <p className="mt-1 text-on-hero-muted">
            {clockBn(next.start, true)} • <b className="text-on-hero">{durationBn(next.inMinutes)}</b> পর
          </p>
        ) : null}
      </section>

      <ol className="surface overflow-hidden rounded-card">
        {rows.map((row) => {
          const current = now !== null && row.end !== undefined && now >= row.start && now < row.end;
          const past = now !== null && (row.end ?? row.start + 1) <= now;
          return (
            <li
              key={row.id}
              className={cn(
                "flex items-center gap-3 border-b border-hairline px-4 py-3.5 last:border-b-0",
                current && row.kind === "forbidden" && "bg-danger-soft",
                current && row.kind === "waqt" && "bg-primary-soft",
                past && !current && "opacity-55",
              )}
            >
              <span
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  row.kind === "forbidden" ? "bg-danger-soft text-danger" : row.kind === "waqt" ? "bg-primary-soft text-primary" : "bg-gold-soft text-gold",
                )}
              >
                <row.icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block font-semibold", row.kind === "forbidden" ? "text-danger" : "text-foreground")}>{row.label}</span>
                {row.hint ? <span className="block text-xs text-muted-foreground">{row.hint}</span> : null}
                {current ? (
                  <span className={cn("mt-0.5 block text-xs font-semibold", row.kind === "forbidden" ? "text-danger" : "text-primary")}>
                    {row.kind === "forbidden" ? "এখন নিষিদ্ধ সময়" : "চলমান ওয়াক্ত"} — {durationBn((row.end ?? 0) - (now ?? 0))} বাকি
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                {clockBn(row.start)}
                {row.end !== undefined && row.end < 24 * 60 ? <span className="block text-xs font-normal text-muted-foreground">– {clockBn(row.end)}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="px-1 text-xs leading-5 text-muted-foreground">নিষিদ্ধ সময় (আনুমানিক): {FORBIDDEN_NOTE}</p>
    </div>
  );
}
