"use client";

import { ChevronLeft, ChevronRight, ListOrdered, Pause, Play, Volume2 } from "lucide-react";

import { cn } from "@/lib/utils";

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold text-stone-500 transition-colors active:bg-stone-100 active:text-emerald-900 disabled:opacity-30"
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  );
}

/**
 * Fixed bottom toolbar — it sits outside the scrolling reading area, so it
 * never covers text. No progress/timeline bar anywhere by design.
 */
export function ReaderToolbar({
  hasPrev,
  hasNext,
  playing,
  disabled,
  reciterLabel,
  onPrev,
  onNext,
  onOpenList,
  onOpenAudio,
  onTogglePlay,
}: {
  hasPrev: boolean;
  hasNext: boolean;
  playing: boolean;
  disabled: boolean;
  reciterLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenList: () => void;
  onOpenAudio: () => void;
  onTogglePlay: () => void;
}) {
  return (
    <nav
      aria-label="কুরআন পাঠ নিয়ন্ত্রণ"
      className="z-20 shrink-0 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid max-w-3xl grid-cols-5 items-center gap-1 px-3 py-2">
        <ToolbarButton label="আগের" disabled={!hasPrev || disabled} onClick={onPrev}>
          <ChevronLeft className="size-5" />
        </ToolbarButton>

        <ToolbarButton label="তালিকা" disabled={disabled} onClick={onOpenList}>
          <ListOrdered className="size-5" />
        </ToolbarButton>

        <button
          type="button"
          onClick={onTogglePlay}
          disabled={disabled}
          aria-label={playing ? "থামান" : "সূরা শুনুন"}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-bold text-emerald-950 disabled:opacity-30"
        >
          <span
            className={cn(
              "grid size-11 place-items-center rounded-full text-white shadow-md",
              playing ? "bg-amber-500" : "bg-emerald-800",
            )}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5 fill-current" />}
          </span>
          <span className="truncate">{playing ? "থামান" : "শুনুন"}</span>
        </button>

        <ToolbarButton label={reciterLabel} disabled={disabled} onClick={onOpenAudio}>
          <Volume2 className="size-5" />
        </ToolbarButton>

        <ToolbarButton label="পরের" disabled={!hasNext || disabled} onClick={onNext}>
          <ChevronRight className="size-5" />
        </ToolbarButton>
      </div>
    </nav>
  );
}
