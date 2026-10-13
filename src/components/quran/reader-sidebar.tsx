"use client";

import { ArrowLeft } from "lucide-react";

import { SurahPickerContent } from "@/components/quran/surah-picker";
import type { Mode } from "@/components/quran/types";
import { cn } from "@/lib/utils";

/**
 * Persistent desktop navigation rail (`lg+` only — `hidden` below `lg`, where
 * the same list lives in the SurahPicker bottom sheet).
 *
 * It hosts the surah/juz mode switch, the search field and the scrollable
 * 114-surah / 30-juz list with the current selection highlighted. It renders
 * the SAME data the mobile picker uses (static `SURAH_LIST`, no extra fetch)
 * through the shared `SurahPickerContent`.
 */
export function ReaderSidebar({
  mode,
  selected,
  onModeChange,
  onSelect,
  onBack,
  className,
}: {
  mode: Mode;
  selected: number;
  onModeChange: (mode: Mode) => void;
  onSelect: (mode: Mode, id: number) => void;
  onBack: () => void;
  className?: string;
}) {
  return (
    <aside
      aria-label="সূরা ও পারা নেভিগেশন"
      className={cn(
        "hidden w-[17rem] shrink-0 flex-col border-r border-stone-200 bg-white lg:flex",
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 bg-emerald-950 px-3 py-3 text-white">
        <button
          type="button"
          aria-label="ড্যাশবোর্ডে ফিরে যান"
          onClick={onBack}
          title="ড্যাশবোর্ডে ফিরে যান"
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl transition-colors hover:bg-emerald-900 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-black leading-tight">আল-কুরআন</p>
          <p className="truncate text-[11px] font-medium leading-tight text-emerald-200">
            সূরা ও পারা নির্বাচন
          </p>
        </div>
      </div>

      <SurahPickerContent
        className="p-3"
        mode={mode}
        selected={selected}
        onModeChange={onModeChange}
        onSelect={onSelect}
      />
    </aside>
  );
}
