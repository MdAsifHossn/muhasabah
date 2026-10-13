"use client";

import { History, X } from "lucide-react";

import type { Mode } from "@/components/quran/types";
import { toBn, TOTAL_AYAHS } from "@/lib/quran-progress";
import { cn } from "@/lib/utils";

export type ResumeTarget = {
  mode: Mode;
  surah: number;
  juz: number | null;
  ayahInSurah: number;
};

/** "পড়া হয়েছে N / ৬২৩৬ আয়াত (X%)" pill — used by the mobile strip AND the desktop header. */
export function ReadCountChip({ readCount }: { readCount: number }) {
  const percent = Math.min(100, Math.round((readCount / TOTAL_AYAHS) * 100));
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
      পড়া হয়েছে {toBn(readCount)} / {toBn(TOTAL_AYAHS)} আয়াত ({toBn(percent)}%)
    </span>
  );
}

/**
 * Dismissible "continue where you left off" card with the restart action.
 * On mobile it sits inside the progress strip (in the flex column); on
 * desktop it floats right under the sticky header, so it never reflows the
 * layout when it appears or is dismissed.
 */
export function ResumeBanner({
  resume,
  onStartOver,
  onDismiss,
  showDismiss = false,
  className,
}: {
  resume: ResumeTarget;
  onStartOver: () => void;
  onDismiss: () => void;
  /** Mobile renders its dismiss button next to the chip instead — desktop floats its own. */
  showDismiss?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-300/70 bg-amber-50 px-3 py-2 shadow-sm",
        className,
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold text-amber-900">
        <History className="size-4 shrink-0" />
        <span className="truncate">
          যেখানে পড়েছিলেন — সূরা {toBn(resume.surah)}, আয়াত {toBn(resume.ayahInSurah)}
          {resume.mode === "juz" && resume.juz ? ` • পারা ${toBn(resume.juz)}` : ""}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onStartOver}
          className="shrink-0 cursor-pointer rounded-xl bg-emerald-900 px-3 py-2 text-xs font-bold text-white transition-colors active:bg-emerald-950 lg:hover:bg-emerald-950"
        >
          সূরার শুরু থেকে
        </button>
        {showDismiss ? (
          <button
            type="button"
            aria-label="রিজিউম ব্যানার বন্ধ করুন"
            onClick={onDismiss}
            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-stone-500 transition-colors hover:bg-amber-100 hover:text-emerald-950"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Compact reading-progress chip + dismissible resume banner.
 *
 * It is rendered as a `shrink-0` strip in the reader's flex column (between
 * the header and the scrolling area), so it can never overlap the bottom
 * toolbar, the text, or the safe-area padding. Hidden on `lg+`, where the
 * desktop header shows the chip and the banner floats below it instead.
 */
export function ReaderProgressStrip({
  readCount,
  resume,
  onStartOver,
  onDismiss,
}: {
  readCount: number;
  resume: ResumeTarget | null;
  onStartOver: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="z-10 shrink-0 space-y-2 border-b border-emerald-100 bg-[#f5f3ed] px-4 py-2 lg:hidden">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2">
        <ReadCountChip readCount={readCount} />

        {resume ? (
          <button
            type="button"
            aria-label="রিজিউম ব্যানার বন্ধ করুন"
            onClick={onDismiss}
            className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-stone-500 active:bg-stone-200"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {resume ? (
        <ResumeBanner resume={resume} onStartOver={onStartOver} onDismiss={onDismiss} className="mx-auto w-full max-w-3xl" />
      ) : null}
    </div>
  );
}
