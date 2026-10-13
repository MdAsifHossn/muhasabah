import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: string | number;
  note?: string;
  icon?: LucideIcon;
  /** Optional 0–100 progress bar under the number. */
  progress?: number;
  className?: string;
}

/**
 * A single number with its meaning. Two of these fit side by side on a phone
 * (see the dashboard grid) and four across on desktop.
 */
export function StatTile({ label, value, note, icon: Icon, progress, className }: StatTileProps) {
  return (
    <div className={cn("surface rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-stone-500 sm:text-sm">{label}</p>
          <p className="mt-1.5 text-xl font-bold tabular-nums leading-7 text-emerald-950 sm:text-2xl">{value}</p>
          {note ? <p className="mt-0.5 text-[11px] leading-4 text-stone-400 sm:text-xs">{note}</p> : null}
        </div>
        {Icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 sm:size-10">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
      {typeof progress === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-200/70">
          <div
            className="h-full rounded-full bg-emerald-700 transition-[width] duration-500 ease-soft"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
