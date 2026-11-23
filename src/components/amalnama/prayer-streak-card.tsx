import { Crown, Flame, Trophy } from "lucide-react";

import { toBn } from "@/components/amalnama/report-data";
import type { PrayerStreak } from "@/lib/streaks";
import { cn } from "@/lib/utils";

function motivation(streak: PrayerStreak) {
  if (streak.current === 0) return streak.best > 0 ? "আজ থেকে আবার শুরু হোক।" : "আজ থেকেই শুরু হোক।";
  if (streak.current >= 40) return "মাশাআল্লাহ! আল্লাহ কবুল করুন।";
  if (streak.current >= streak.best && streak.current >= 3) return "মাশাআল্লাহ! নতুন রেকর্ড।";
  return "মাশাআল্লাহ, ধরে রাখুন।";
}

/**
 * Highlight of the member's best amal: how many days in a row every waqt was
 * prayed with তাকবীরে উলা (brothers) / আউয়াল ওয়াক্তে (sisters).
 */
export function PrayerStreakCard({ streak, className, embedded = false }: { streak: PrayerStreak; className?: string; embedded?: boolean }) {
  const isRecord = streak.current > 0 && streak.current >= streak.best;
  return (
    <section
      aria-label={`${streak.label} ধারাবাহিকতা`}
      className={cn(
        // `embedded`: sits inside another banner (home greeting) — no background of its own.
        embedded
          ? "relative rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15"
          : "streak-surface relative overflow-hidden rounded-card px-4 py-3 shadow-raised sm:px-5 sm:py-4",
        className,
      )}
    >
      {/* Compact: the title gets the full width (one line on phones); the record sits inline with the count. */}
      <div className="relative flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
          {isRecord ? <Crown className="size-5 text-marble-200" /> : <Flame className="size-5 text-marble-200" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-bold leading-5 text-white sm:text-base">পাঁচ ওয়াক্তে {streak.label}</h2>
          {/* "টানা ১২ দিন" — the number in a pill so a lone ০ never reads as the letter O. */}
          <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-marble-100">
            টানা
            <span className="inline-grid min-w-7 place-items-center rounded-md bg-white/15 px-1.5 text-base font-bold leading-6 tabular-nums text-white ring-1 ring-white/20">
              {toBn(streak.current)}
            </span>
            দিন
            <span className="ml-1 inline-flex items-center gap-1 text-xs font-medium text-marble-100/80">
              <Trophy className="size-3.5" /> সর্বোচ্চ {toBn(streak.best)}
            </span>
          </p>
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
      <div className="relative mt-2 flex items-center justify-between gap-2 text-xs">
        <p className="min-w-0 truncate font-medium text-white/85">{motivation(streak)}</p>
        {streak.todayTotal > 0 ? (
          <p className="shrink-0 whitespace-nowrap rounded-lg bg-white/15 px-2.5 py-1 font-semibold text-white">
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
        "inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold",
        current > 0 ? "bg-gold-soft text-gold-foreground" : "bg-surface-sunken text-subtle-foreground",
      )}
    >
      <Flame className="size-3" /> {toBn(current)} দিন
      <span className="font-semibold opacity-70">• সেরা {toBn(best)}</span>
    </span>
  );
}
