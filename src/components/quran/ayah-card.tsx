"use client";

import type { FontSize, ReaderAyah } from "@/components/quran/types";
import { ARABIC_SIZE, BANGLA_SIZE } from "@/components/quran/types";
import { cn } from "@/lib/utils";

/**
 * One ayah = one card. Tapping the card plays THAT ayah's own audio URL
 * (`ayah.audio`) — no timeline, no progress bar, only an active highlight.
 * The highlight never changes the card's height, so nothing jumps on scroll.
 */
export function AyahCard({
  ayah,
  fontSize,
  showArabic,
  showBangla,
  playing,
  onPlay,
}: {
  ayah: ReaderAyah;
  fontSize: FontSize;
  showArabic: boolean;
  showBangla: boolean;
  playing: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`আয়াত ${ayah.numberInSurah} শুনুন`}
      aria-pressed={playing}
      className={cn(
        "w-full cursor-pointer rounded-2xl border p-4 text-left shadow-sm transition-colors sm:p-5",
        playing
          ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300/60"
          : "border-stone-200 bg-white active:border-emerald-300 active:bg-emerald-50/40 lg:hover:border-emerald-300 lg:hover:bg-emerald-50/40",
      )}
    >
      <div className="flex items-start gap-3" dir={showArabic ? "rtl" : "ltr"}>
        <span
          className={cn(
            "mt-1 grid size-8 shrink-0 place-items-center rounded-full border text-[12px] font-bold",
            playing
              ? "border-emerald-800 bg-emerald-800 text-white"
              : "border-amber-500/70 bg-amber-50 text-emerald-900",
          )}
        >
          {ayah.numberInSurah.toLocaleString("ar-EG")}
        </span>
        <div className="min-w-0 flex-1">
          {showArabic ? (
            <p
              dir="rtl"
              className={cn("text-right font-serif text-emerald-950", ARABIC_SIZE[fontSize])}
            >
              {ayah.arabic}
            </p>
          ) : null}
          {showBangla ? (
            <p
              dir="ltr"
              className={cn(
                "mt-2.5 border-t border-stone-100 pt-2.5 text-left leading-relaxed text-stone-600",
                BANGLA_SIZE[fontSize],
              )}
            >
              {ayah.bangla}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
