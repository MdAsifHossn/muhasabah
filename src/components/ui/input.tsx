import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Text fields are 44px tall with a 16px base font: comfortable to tap and it
 * keeps iOS from auto-zooming when the field is focused (see globals.css).
 * Focus uses the app-wide emerald ring so every form feels the same.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-base text-stone-900 transition placeholder:text-stone-400 focus-visible:border-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700/10 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400 read-only:bg-stone-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";
