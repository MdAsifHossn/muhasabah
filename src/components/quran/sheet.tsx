"use client";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";

/** Reader sheets (settings, ayah jump …) — shared Radix-based responsive sheet. */
export function Sheet({ open, title, onClose, children, className }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; className?: string }) {
  return (
    <ResponsiveSheet open={open} title={title} onClose={onClose} className={className}>
      {children}
    </ResponsiveSheet>
  );
}

/** Segmented-control style option button used inside sheets. */
export function optionClass(active: boolean) {
  return cn(
    "min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition",
    active
      ? "border-primary bg-primary-soft text-primary-soft-foreground"
      : "border-hairline bg-surface text-muted-foreground hover:border-hairline-strong hover:text-foreground",
  );
}
