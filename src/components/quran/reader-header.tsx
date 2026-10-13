"use client";

import { ArrowLeft, Pause, Play, Settings2 } from "lucide-react";

/**
 * Fixed, stable top bar: its height never changes (single 56px row), so the
 * header cannot jump or grow while the ayah list scrolls underneath.
 */
export function ReaderHeader({
  title,
  meta,
  playing,
  disabled,
  onBack,
  onTogglePlay,
  onOpenSettings,
}: {
  title: string;
  meta: string;
  playing: boolean;
  disabled: boolean;
  onBack: () => void;
  onTogglePlay: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-2 border-b border-emerald-900 bg-emerald-950 px-3 text-white shadow-md sm:px-5 lg:hidden">
      <button
        type="button"
        aria-label="ড্যাশবোর্ডে ফিরে যান"
        onClick={onBack}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-white active:bg-emerald-900"
      >
        <ArrowLeft className="size-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold leading-tight sm:text-base">{title}</p>
        <p className="truncate text-[11px] font-medium leading-tight text-emerald-200">{meta}</p>
      </div>

      <span
        className={
          playing
            ? "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 text-[11px] font-bold text-amber-300"
            : "hidden"
        }
      >
        <span className="size-1.5 animate-pulse rounded-full bg-amber-300" />
        শুনা হচ্ছে
      </span>

      <button
        type="button"
        aria-label="শ্রবণ চালু বা বন্ধ করুন"
        disabled={disabled}
        onClick={onTogglePlay}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-white active:bg-emerald-900 disabled:opacity-40"
      >
        {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
      </button>

      <button
        type="button"
        aria-label="পাঠ সেটিংস"
        onClick={onOpenSettings}
        className="grid size-10 shrink-0 place-items-center rounded-xl text-white active:bg-emerald-900"
      >
        <Settings2 className="size-5" />
      </button>
    </header>
  );
}
