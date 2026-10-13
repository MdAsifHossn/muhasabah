"use client";

import { Sheet, sheetButtonClass } from "@/components/quran/sheet";
import type { FontSize, ViewMode } from "@/components/quran/types";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS: [ViewMode, string][] = [
  ["both", "আরবি + বাংলা"],
  ["arabic", "শুধু আরবি"],
  ["bangla", "শুধু বাংলা"],
  ["mushaf", "মুশাফ পাতা"],
];

const SIZE_OPTIONS: [FontSize, string][] = [
  ["small", "ছোট"],
  ["medium", "মাঝারি"],
  ["large", "বড়"],
];

export function SettingsSheet({
  open,
  viewMode,
  fontSize,
  onViewMode,
  onFontSize,
  onClose,
}: {
  open: boolean;
  viewMode: ViewMode;
  fontSize: FontSize;
  onViewMode: (value: ViewMode) => void;
  onFontSize: (value: FontSize) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} title="পাঠ সেটিংস" onClose={onClose}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-400">কীভাবে পড়বেন</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {VIEW_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onViewMode(value)}
            className={sheetButtonClass(viewMode === value)}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-stone-400">লেখার আকার</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {SIZE_OPTIONS.map(([value, label], index) => (
          <button
            key={value}
            type="button"
            onClick={() => onFontSize(value)}
            className={cn("flex items-center justify-center gap-2", sheetButtonClass(fontSize === value))}
          >
            <span className={cn("font-serif leading-none", index === 0 && "text-sm", index === 1 && "text-base", index === 2 && "text-lg")}>
              A
            </span>
            {label}
          </button>
        ))}
      </div>

      <p className="mt-5 rounded-2xl bg-stone-50 p-3 text-xs leading-relaxed text-stone-500">
        প্রতিটি আয়াতে ট্যাপ করলে সেই আয়াতের নিজস্ব তিলাওয়াত শুনা যাবে। অডিওতে কোনো টাইমলাইন বা প্রোগ্রেস বার দেখানো হয় না।
      </p>
    </Sheet>
  );
}
