"use client";

import type { ReactNode } from "react";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";

/** Staff editors (users, amal items) — shared Radix-based responsive sheet. */
export function Sheet({ open, onClose, title, description, children, className }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <ResponsiveSheet open={open} onClose={onClose} title={title} description={description} className={cn("sm:max-w-xl", className)}>
      {children}
    </ResponsiveSheet>
  );
}

/** Compact segmented tab row (horizontally scrollable on phones). */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1", className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-semibold transition",
              active ? "border-transparent bg-primary text-on-primary shadow-sm" : "border-hairline bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/20" : "bg-surface-sunken")}>{option.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
