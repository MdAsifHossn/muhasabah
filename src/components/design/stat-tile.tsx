import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: string | number;
  note?: string;
  icon?: LucideIcon;
  /** Optional 0–100 progress bar under the number. */
  progress?: number;
  tone?: "primary" | "gold" | "info" | "danger" | "female";
  className?: string;
}

const toneClass = {
  primary: "bg-primary-soft text-primary",
  gold: "bg-gold-soft text-gold",
  info: "bg-info-soft text-info",
  danger: "bg-danger-soft text-danger",
  female: "bg-female-soft text-female",
};

/** A single number with its meaning. Two fit side by side on a phone. */
export function StatTile({ label, value, note, icon: Icon, progress, tone = "primary", className }: StatTileProps) {
  return (
    <div className={cn("surface rounded-card p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">{label}</p>
          <p className="mt-1 text-xl font-bold tabular-nums leading-7 text-foreground sm:text-2xl">{value}</p>
          {note ? <p className="mt-0.5 text-[11px] leading-4 text-subtle-foreground sm:text-xs">{note}</p> : null}
        </div>
        {Icon ? (
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl sm:size-10", toneClass[tone])}>
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
      {typeof progress === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-soft"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
