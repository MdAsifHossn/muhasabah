import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** shadcn/ui field look: 44px, 16px text on phones (no iOS zoom), ring on focus. */
export const fieldClass =
  "w-full min-w-0 rounded-xl border border-input bg-card px-3.5 text-base text-foreground shadow-xs transition-[color,box-shadow] outline-none placeholder:text-subtle-foreground selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/20";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldClass, "h-11 py-2 file:border-0 file:bg-transparent file:text-sm file:font-medium", className)} {...props} />;
}

/** Native select styled like the inputs (works everywhere, incl. inside forms with server actions). */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="native-select" className={cn(fieldClass, "h-11 appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat py-2 pr-9 [background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238d9893' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(fieldClass, "min-h-28 py-3 leading-6", className)} {...props} />;
}

/** Label + control + optional hint. */
function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export { Field, Input, Select, Textarea };
