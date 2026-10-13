"use client";

import { Check } from "lucide-react";

import { Sheet } from "@/components/quran/sheet";
import { RECITERS } from "@/components/quran/types";
import { cn } from "@/lib/utils";

/** Reciter / audio picker — swaps the per-ayah audio URLs for the whole surah. */
export function AudioSheet({
  open,
  reciter,
  onSelect,
  onClose,
}: {
  open: boolean;
  reciter: string;
  onSelect: (reciter: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} title="ক্বারী নির্বাচন করুন" onClose={onClose} variant="panel">
      <div className="space-y-2">
        {RECITERS.map((item) => {
          const active = item.id === reciter;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                "flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-right transition-colors",
                active
                  ? "border-emerald-800 bg-emerald-50"
                  : "border-stone-200 active:bg-stone-50 lg:hover:border-emerald-300 lg:hover:bg-emerald-50",
              )}
            >
              <span className="min-w-0 flex-1">
                <b className={cn("block truncate text-sm", active ? "text-emerald-950" : "text-stone-700")}>{item.name}</b>
              </span>
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border",
                  active ? "border-emerald-800 bg-emerald-800 text-white" : "border-stone-300 text-transparent",
                )}
              >
                <Check className="size-4" />
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-stone-500">
        ক্বারী বদলালে সূরাটি নতুন কণ্ঠে লোড হবে — আয়াতভিত্তিক তিলাওয়াত যেমন ছিল তেমনই থাকবে।
      </p>
    </Sheet>
  );
}
