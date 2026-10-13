import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "soft" | "warning" | "danger";
}

/** Compact status pill. Colour is semantic; the shape stays a full round pill
 *  so badges read the same wherever they appear (cards, tables, headers). */
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-4 transition-colors",
        variant === "default" && "border-transparent bg-emerald-900 text-white",
        variant === "secondary" && "border-transparent bg-stone-100 text-stone-700",
        variant === "outline" && "border-hairline-strong bg-white text-stone-700",
        variant === "soft" && "border-emerald-100 bg-emerald-50 text-emerald-800",
        variant === "warning" && "border-amber-100 bg-amber-50 text-amber-800",
        variant === "danger" && "border-red-100 bg-red-50 text-red-700",
        className,
      )}
      {...props}
    />
  );
}
