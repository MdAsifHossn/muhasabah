import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variant === "default" && "border-transparent bg-emerald-900 text-white shadow hover:bg-emerald-900/80",
        variant === "secondary" && "border-transparent bg-stone-100 text-stone-900 hover:bg-stone-100/80",
        variant === "outline" && "text-stone-950 border-stone-200",
        className
      )}
      {...props}
    />
  );
}
