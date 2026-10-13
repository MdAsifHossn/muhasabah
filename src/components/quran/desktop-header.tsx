"use client";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Settings2,
  Volume2,
} from "lucide-react";

import { ReadCountChip } from "@/components/quran/reader-progress";
import type { FontSize, ViewMode } from "@/components/quran/types";
import { cn } from "@/lib/utils";

/** Compact labels so everything fits one row at 1024px next to the sidebar. */
const VIEW_OPTIONS: [ViewMode, string][] = [
  ["both", "আরবি+বাংলা"],
  ["arabic", "আরবি"],
  ["bangla", "বাংলা"],
  ["mushaf", "মুশাফ"],
];

const SIZE_OPTIONS: [FontSize, string][] = [
  ["small", "ছোট"],
  ["medium", "মাঝারি"],
  ["large", "বড়"],
];

const SIZE_GLYPH: Record<FontSize, string> = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

/**
 * Desktop (`lg+`) top chrome — two sticky rows instead of the compact mobile
 * bar + fixed bottom toolbar:
 *
 *   row 1 — back • current surah/juz + ayah range • read-% chip • play • reciter • settings
 *   row 2 — prev/next unit • 4 view modes • font size • "শুনা হচ্ছে" indicator
 *
 * It lives OUTSIDE the scrolling reading pane, so it never covers text and
 * the reading area never shifts (the resume banner floats below it separately).
 */
export function DesktopHeader({
  title,
  meta,
  mode,
  hasPrev,
  hasNext,
  playing,
  disabled,
  viewMode,
  fontSize,
  reciterLabel,
  readCount,
  onBack,
  onPrev,
  onNext,
  onTogglePlay,
  onViewMode,
  onFontSize,
  onOpenAudio,
  onOpenSettings,
}: {
  title: string;
  meta: string;
  mode: "surah" | "juz";
  hasPrev: boolean;
  hasNext: boolean;
  playing: boolean;
  disabled: boolean;
  viewMode: ViewMode;
  fontSize: FontSize;
  reciterLabel: string;
  /** `null` for guests — hides the "পড়া হয়েছে" chip entirely. */
  readCount: number | null;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onViewMode: (value: ViewMode) => void;
  onFontSize: (value: FontSize) => void;
  onOpenAudio: () => void;
  onOpenSettings: () => void;
}) {
  const unitLabel = mode === "surah" ? "সূরা" : "পারা";

  return (
    <header className="z-30 shrink-0 border-b border-stone-200 bg-white">
      {/* Row 1 — identity + playback + chrome actions */}
      <div className="flex items-center gap-3 px-5 py-2.5">
        <button
          type="button"
          aria-label="ড্যাশবোর্ডে ফিরে যান"
          title="ড্যাশবোর্ডে ফিরে যান"
          onClick={onBack}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-stone-500 transition-colors hover:bg-stone-100 hover:text-emerald-950"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-black leading-tight text-emerald-950">{title}</p>
          <p className="truncate text-xs font-medium leading-tight text-stone-500">{meta}</p>
        </div>

        {readCount !== null ? <ReadCountChip readCount={readCount} /> : null}

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={playing ? "থামান" : "সূরা শুনুন"}
          title={playing ? "থামান" : "সূরা শুনুন"}
          className={cn(
            "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            playing ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-800 hover:bg-emerald-700",
          )}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
          {playing ? "থামান" : "শুনুন"}
        </button>

        <button
          type="button"
          onClick={onOpenAudio}
          title="ক্বারী পরিবর্তন"
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-bold text-stone-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950"
        >
          <Volume2 className="size-4" />
          <span className="max-w-28 truncate">{reciterLabel}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="পাঠ সেটিংস"
          title="পাঠ সেটিংস"
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950"
        >
          <Settings2 className="size-5" />
        </button>
      </div>

      {/* Row 2 — unit navigation + reading controls */}
      <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 bg-stone-50/70 px-5 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev || disabled}
            title={`আগের ${unitLabel}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] font-bold text-stone-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-stone-200 disabled:hover:bg-white disabled:hover:text-stone-600"
          >
            <ChevronLeft className="size-4" />
            আগের
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!hasNext || disabled}
            title={`পরের ${unitLabel}`}
            className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-[13px] font-bold text-stone-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-stone-200 disabled:hover:bg-white disabled:hover:text-stone-600"
          >
            পরের
            <ChevronRight className="size-4" />
          </button>
        </div>

        <span aria-hidden className="mx-1 hidden h-6 w-px bg-stone-200 xl:block" />

        {/* View mode segmented control */}
        <div
          role="group"
          aria-label="পাঠের ধরন"
          className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1"
        >
          {VIEW_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onViewMode(value)}
              aria-pressed={viewMode === value}
              title={label}
              className={cn(
                "cursor-pointer rounded-lg px-2.5 py-1.5 text-[13px] font-bold transition-colors",
                viewMode === value
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "text-stone-500 hover:bg-stone-100 hover:text-emerald-950",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Font size segmented control */}
        <div
          role="group"
          aria-label="লেখার আকার"
          className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1"
        >
          {SIZE_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onFontSize(value)}
              aria-pressed={fontSize === value}
              aria-label={label}
              title={`লেখার আকার: ${label}`}
              className={cn(
                "grid size-7 cursor-pointer place-items-center rounded-lg font-serif leading-none transition-colors",
                SIZE_GLYPH[value],
                fontSize === value
                  ? "bg-emerald-950 text-white shadow-sm"
                  : "text-stone-500 hover:bg-stone-100 hover:text-emerald-950",
              )}
            >
              A
            </button>
          ))}
        </div>

        <span className="flex-1" />

        {/* Space is always reserved → the row never jumps when playback starts. */}
        <span
          aria-hidden={!playing}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-1 text-[11px] font-bold text-amber-700 transition-opacity",
            playing ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
          শুনা হচ্ছে
        </span>
      </div>
    </header>
  );
}
