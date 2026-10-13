"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Sheet, sheetButtonClass } from "@/components/quran/sheet";
import type { Mode } from "@/components/quran/types";
import { SURAH_LIST } from "@/lib/quran";
import { cn } from "@/lib/utils";

/**
 * The picker BODY (mode switch + search + scrollable surah/juz list) with no
 * sheet/chrome around it, so the desktop sidebar can render it as a
 * permanently visible panel. Below `lg` it only ever appears inside the
 * bottom-sheet `SurahPicker` wrapper — every `lg:`-prefixed class is inert on
 * mobile.
 */
export function SurahPickerContent({
  mode,
  selected,
  onModeChange,
  onSelect,
  open = true,
  className,
}: {
  mode: Mode;
  selected: number;
  onModeChange: (mode: Mode) => void;
  onSelect: (mode: Mode, id: number) => void;
  /** Mobile sheet open state — resets the search query when the sheet closes. */
  open?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  // Clear the search once the mobile sheet closes. Compared during render
  // (react.dev "You Might Not Need an Effect") instead of an effect, so the
  // reset never costs an extra commit.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setQuery("");
  }

  const filtered = useMemo(
    () =>
      SURAH_LIST.filter((surah) =>
        `${surah.number} ${surah.banglaName} ${surah.englishName}`.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  return (
    <div className={cn("lg:flex lg:min-h-0 lg:flex-1 lg:flex-col", className)}>
      <div className="lg:shrink-0">
        <div className="flex rounded-2xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => onModeChange("surah")}
            className={cn("flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-bold", sheetButtonClass(mode === "surah"))}
          >
            ১১৪ সূরা
          </button>
          <button
            type="button"
            onClick={() => onModeChange("juz")}
            className={cn("flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-bold", sheetButtonClass(mode === "juz"))}
          >
            ৩০ পারা
          </button>
        </div>

        {mode === "surah" ? (
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-stone-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="সূরা খুঁজুন..."
              className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-600"
            />
          </div>
        ) : null}
      </div>

      <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:[scrollbar-color:#d6d3d1_transparent] lg:[scrollbar-width:thin] lg:[&::-webkit-scrollbar]:w-2 lg:[&::-webkit-scrollbar]:rounded-full lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-stone-300 lg:[&::-webkit-scrollbar-thumb]:hover:bg-stone-400">
        {mode === "surah" ? (
          <div className="mt-3 space-y-1">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-stone-400">কোনো সূরা পাওয়া যায়নি</p>
            ) : null}
            {filtered.map((surah) => {
              const active = selected === surah.number;
              return (
                <button
                  key={surah.number}
                  type="button"
                  onClick={() => onSelect("surah", surah.number)}
                  className={cn(
                    "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
                    active ? "bg-emerald-950 text-white" : "active:bg-emerald-50 lg:hover:bg-emerald-50",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black",
                      active ? "bg-amber-400 text-emerald-950" : "bg-stone-100 text-stone-600",
                    )}
                  >
                    {surah.number}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm">{surah.banglaName}</b>
                    <small className={cn("block truncate text-xs", active ? "text-emerald-200" : "text-stone-400")}>
                      {surah.englishName} • {surah.numberOfAyahs} আয়াত
                    </small>
                  </span>
                  <span dir="rtl" className="shrink-0 text-right font-serif text-lg">
                    {surah.name.replace("سُورَةُ ", "")}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 30 }, (_, index) => index + 1).map((juz) => {
              const active = selected === juz;
              return (
                <button
                  key={juz}
                  type="button"
                  onClick={() => onSelect("juz", juz)}
                  className={cn(
                    "min-h-16 cursor-pointer rounded-2xl border p-3 text-center transition-colors",
                    active
                      ? "border-emerald-950 bg-emerald-950 text-white shadow"
                      : "border-stone-200 active:border-emerald-400 active:bg-emerald-50 lg:hover:border-emerald-400 lg:hover:bg-emerald-50",
                  )}
                >
                  <span className="block text-xs opacity-60">পারা</span>
                  <b className="mt-0.5 block text-xl">{juz}</b>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Full-height picker sheet for jumping to any surah or juz (mobile / <lg). */
export function SurahPicker({
  open,
  mode,
  selected,
  onModeChange,
  onSelect,
  onClose,
}: {
  open: boolean;
  mode: Mode;
  selected: number;
  onModeChange: (mode: Mode) => void;
  onSelect: (mode: Mode, id: number) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} title="সূরা বা পারা নির্বাচন করুন" onClose={onClose}>
      <SurahPickerContent
        open={open}
        mode={mode}
        selected={selected}
        onModeChange={onModeChange}
        onSelect={onSelect}
      />
    </Sheet>
  );
}
