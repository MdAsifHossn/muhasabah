"use client";

import { AlarmClock, BellRing, Moon, ShieldAlert, Sun, Sunrise, Sunset } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect, useState } from "react";

import { getEventState, pruneOldEventState, setEventState, usePrayerMinutes, useReminderSettings } from "@/components/prayer/reminder-store";
import { Button } from "@/components/ui/button";
import { bnDigits, clockBn, dhakaNowMinutes, getPrayerEvents, WAQT_LABELS, type PrayerEvent, type WaqtKey } from "@/lib/forbidden-times";
import { cn } from "@/lib/utils";

/** An event is announced only if the page is open within this many minutes of its start. */
const FRESH_MINUTES = 10;
const SNOOZE_MS = 5 * 60 * 1000;
const TICK_MS = 15 * 1000;

const ICONS: Record<string, typeof Sun> = {
  "waqt-fajr": Sunrise,
  "waqt-dhuhr": Sun,
  "waqt-asr": Sun,
  "waqt-maghrib": Sunset,
  "waqt-isha": Moon,
};

/** Seconds since Dhaka midnight (Dhaka is a whole-hour offset, so seconds are local). */
function dhakaNowSeconds() {
  return dhakaNowMinutes() * 60 + new Date().getSeconds();
}

function formatCountdown(seconds: number) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const pad = (value: number) => bnDigits(String(value).padStart(2, "0"));
  return h > 0 ? `${bnDigits(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** `?prayer-test=dhuhr` (any waqt) or `?prayer-test=forbidden` previews the overlay — never stored. */
function readTestEvent(events: PrayerEvent[]): PrayerEvent | null {
  try {
    const value = new URLSearchParams(window.location.search).get("prayer-test");
    if (!value) return null;
    const now = dhakaNowMinutes();
    const base =
      value === "forbidden"
        ? events.find((event) => event.kind === "forbidden")
        : events.find((event) => event.id === `waqt-${value}`) ?? events.find((event) => event.id === `waqt-dhuhr`);
    if (!base) return null;
    return { ...base, id: `test-${base.id}`, start: now, end: now + (base.kind === "forbidden" ? 12 : 45) };
  } catch {
    return null;
  }
}

function notify(event: PrayerEvent) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification(event.kind === "waqt" ? `${event.label} — নামাজের সময়` : `নিষিদ্ধ সময় — ${event.label}`, {
      body: event.message,
      tag: `muhasabah-${event.id}`,
      icon: "/images/icon-192.png",
      lang: "bn",
    });
  } catch {
    /* some mobile browsers only allow notifications from a service worker */
  }
}

/**
 * Alarm-style reminder, mounted once for the whole site. While any page is
 * open it shows a full-screen card at the start of each waqt and each
 * forbidden window (per the member's settings), once per event per day.
 */
export function PrayerReminder() {
  const minutes = usePrayerMinutes();
  const [settings] = useReminderSettings();
  const [event, setEvent] = useState<PrayerEvent | null>(null);
  const [remaining, setRemaining] = useState(0);

  const check = useCallback(() => {
    const events = getPrayerEvents(minutes);
    const test = readTestEvent(events);
    if (test) {
      setEvent((current) => current ?? test);
      return;
    }
    const now = dhakaNowMinutes();
    const nowMs = Date.now();
    for (const candidate of events) {
      const enabled = candidate.kind === "waqt" ? settings.waqt : settings.forbidden;
      if (!enabled) continue;
      if (now < candidate.start || now >= candidate.end) continue;
      const state = getEventState(candidate.id);
      if (state.dismissed) continue;
      const fresh = now - candidate.start <= FRESH_MINUTES;
      const snoozeDue = state.snoozeUntil !== undefined && nowMs >= state.snoozeUntil;
      if (state.snoozeUntil !== undefined ? !snoozeDue : !fresh) continue;
      if (settings.notify && !state.notified) {
        notify(candidate);
        setEventState(candidate.id, { notified: true });
      }
      setEvent((current) => current ?? candidate);
      return;
    }
  }, [minutes, settings]);

  useEffect(() => {
    pruneOldEventState();
  }, []);

  useEffect(() => {
    const first = window.setTimeout(check, 1200);
    const interval = window.setInterval(check, TICK_MS);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  // Live countdown to the end of the window while the overlay is open.
  useEffect(() => {
    if (!event) return;
    const update = () => {
      const left = event.end * 60 - dhakaNowSeconds();
      setRemaining(left);
      if (left <= 0) setEvent(null);
    };
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [event]);

  function dismiss() {
    if (event && !event.id.startsWith("test-")) setEventState(event.id, { dismissed: true, snoozeUntil: undefined });
    setEvent(null);
  }

  function snooze() {
    if (event && !event.id.startsWith("test-")) setEventState(event.id, { snoozeUntil: Date.now() + SNOOZE_MS });
    setEvent(null);
  }

  const forbidden = event?.kind === "forbidden";
  const waqtKey = event?.id.replace(/^test-/, "").replace(/^waqt-/, "") as WaqtKey | undefined;
  const Icon = forbidden ? ShieldAlert : (event && ICONS[event.id.replace(/^test-/, "")]) || BellRing;

  return (
    <DialogPrimitive.Root open={event !== null} onOpenChange={(open) => (!open ? dismiss() : undefined)}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby="prayer-reminder-message"
          className={cn(
            "fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-center outline-none data-[state=open]:animate-fade",
            forbidden ? "text-white" : "hero-surface",
          )}
          style={
            forbidden
              ? { background: "radial-gradient(120% 90% at 50% 0%, #7a2a12 0%, #3b1309 55%, #1c0a06 100%)" }
              : undefined
          }
        >
          {event ? (
            <div className="flex w-full max-w-md flex-col items-center motion-safe:animate-rise">
              <span
                className={cn(
                  "grid size-24 place-items-center rounded-full ring-1 sm:size-28",
                  forbidden ? "bg-amber-500/15 text-amber-300 ring-amber-300/30" : "bg-white/10 text-[#f0cf8c] ring-white/20",
                )}
              >
                <Icon className="size-12 motion-safe:animate-pulse sm:size-14" strokeWidth={1.5} />
              </span>

              <p className={cn("mt-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold", forbidden ? "bg-amber-500/15 text-amber-200" : "bg-white/10 text-on-hero-muted")}>
                <AlarmClock className="size-3.5" />
                {forbidden ? "নামাজের নিষিদ্ধ সময়" : "নামাজের সময়"}
              </p>

              <DialogPrimitive.Title className="mt-3 text-5xl font-bold leading-tight sm:text-6xl">
                {forbidden ? event.label : WAQT_LABELS[waqtKey ?? "dhuhr"] ?? event.label}
              </DialogPrimitive.Title>

              <p className={cn("mt-2 text-lg font-semibold tabular-nums", forbidden ? "text-amber-100/90" : "text-on-hero-muted")}>
                {clockBn(event.start, true)} – {clockBn(event.end, true)}
              </p>

              <DialogPrimitive.Description id="prayer-reminder-message" className={cn("mt-5 text-base leading-7 sm:text-lg", forbidden ? "text-amber-50" : "text-on-hero")}>
                {event.message}
              </DialogPrimitive.Description>

              <div className={cn("mt-6 w-full rounded-2xl px-5 py-4 ring-1", forbidden ? "bg-black/25 ring-amber-200/15" : "bg-black/15 ring-white/10")}>
                <p className={cn("text-xs font-medium", forbidden ? "text-amber-100/80" : "text-on-hero-muted")}>
                  {forbidden ? "নিষিদ্ধ সময় শেষ হতে বাকি" : "এই ওয়াক্ত শেষ হতে বাকি"}
                </p>
                <p className="mt-1 text-4xl font-bold tabular-nums" aria-live="off">
                  {formatCountdown(remaining)}
                </p>
                {forbidden ? <p className="mt-2 text-[11px] text-amber-100/70">সময়গুলো আনুমানিক — কয়েক মিনিট সতর্কতা রাখুন।</p> : null}
              </div>

              <div className="mt-8 grid w-full gap-2.5">
                <Button size="lg" onClick={dismiss} className={cn("w-full text-base", forbidden ? "bg-amber-400 text-[#2a1203] hover:bg-amber-300" : "bg-[#e3b25a] text-[#2a1d02] hover:bg-[#ecc272]")} autoFocus>
                  ঠিক আছে
                </Button>
                {!forbidden ? (
                  <Button size="lg" variant="hero" onClick={snooze} className="w-full text-base">
                    ৫ মিনিট পরে মনে করান
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
