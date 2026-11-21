import { Crown, Flame, Trophy } from "lucide-react";

import { toBn } from "@/components/amalnama/report-data";
import type { PrayerStreak } from "@/lib/streaks";
import { cn } from "@/lib/utils";

function motivation(streak: PrayerStreak) {
  if (streak.current === 0) return streak.best > 0 ? "আবার নতুন করে শুরু করুন — আজ থেকেই।" : "আজ থেকে শুরু হোক ধারাবাহিকতা।";
  if (streak.current >= streak.best && streak.current >= 3) return "মাশাআল্লাহ! এটাই আপনার সর্বোচ্চ রেকর্ড।";
  if (streak.current >= 40) return "মাশাআল্লাহ! চল্লিশ দিনের নূর — আল্লাহ কবুল করুন।";
  return "মাশাআল্লাহ, ধারাবাহিকতা ধরে রাখুন।";
}

/**
 * Highlight of the member's best amal: how many days in a row every waqt was
 * prayed with তাকবীরে উলা (brothers) / আউয়াল ওয়াক্তে (sisters).
 */
export function PrayerStreakCard({ streak, className }: { streak: PrayerStreak; className?: string }) {
  const isRecord = streak.current > 0 && streak.current >= streak.best;
  return (
    <section
      aria-label={`${streak.label} ধারাবাহিকতা`}
      className={cn("streak-surface relative overflow-hidden rounded-card px-4 py-3 shadow-raised sm:px-5 sm:py-4", className)}
    >
      <div className="relative flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
          {isRecord ? <Crown className="size-6 text-marble-200" /> : <Flame className="size-6 text-marble-200" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-bold leading-5 text-white sm:text-base">পাঁচ ওয়াক্তে {streak.label}</h2>
          <p className="mt-0.5 flex items-baseline gap-1.5 text-white">
            <span className="text-3xl font-extrabold tabular-nums leading-none">{toBn(streak.current)}</span>
            <span className="text-sm font-semibold text-marble-100">দিন টানা</span>
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-black/15 px-2.5 py-1.5 text-center ring-1 ring-white/15">
          <p className="flex items-center justify-center gap-1 text-base font-bold tabular-nums leading-none text-white">
            <Trophy className="size-3.5 text-marble-200" /> {toBn(streak.best)}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-marble-100/90">সর্বোচ্চ</p>
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-1" aria-label="শেষ ১৪ দিন">
        {streak.recent.map((mark, index) => (
          <span
            key={index}
            title={mark === true ? "সব ওয়াক্ত" : mark === false ? "মিস হয়েছে" : "প্রযোজ্য নয় / বাকি"}
            className={cn(
              "h-2 flex-1 rounded-full",
              mark === true ? "bg-marble-300" : mark === false ? "bg-white/20" : "bg-white/10 outline-1 outline-dashed outline-white/25",
            )}
          />
        ))}
      </div>
      <div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="font-medium text-white/85">{motivation(streak)}</p>
        {streak.todayTotal > 0 ? (
          <p className="rounded-full bg-white/15 px-2.5 py-1 font-semibold text-white">
            আজ {toBn(streak.todayDone)}/{toBn(streak.todayTotal)} ওয়াক্ত
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** Small pill for lists (Ustadh board). */
export function PrayerStreakPill({ current, best, label }: { current: number; best: number; label: string }) {
  return (
    <span
      title={`${label}: টানা ${toBn(current)} দিন • সর্বোচ্চ ${toBn(best)} দিন`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
        current > 0 ? "bg-gold-soft text-gold-foreground" : "bg-surface-sunken text-subtle-foreground",
      )}
    >
      <Flame className="size-3" /> {toBn(current)} দিন
      <span className="font-semibold opacity-70">• সেরা {toBn(best)}</span>
    </span>
  );
}
