"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const GENDER_OPTIONS = [
  { value: "MALE", label: "পুরুষ" },
  { value: "FEMALE", label: "মহিলা" },
] as const;

type GenderFieldProps = {
  idPrefix: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

/** Two large segmented radio cards (Radix radio group — keyboard + screen-reader friendly). */
export function GenderField({ idPrefix, value, onChange, error }: GenderFieldProps) {
  return (
    <div className="grid gap-2">
      <Label id={`${idPrefix}-gender-label`}>আপনি</Label>
      <RadioGroupPrimitive.Root
        aria-labelledby={`${idPrefix}-gender-label`}
        value={value}
        onValueChange={onChange}
        name="gender"
        required
        className="grid grid-cols-2 gap-2"
      >
        {GENDER_OPTIONS.map((option) => (
          <RadioGroupPrimitive.Item
            key={option.value}
            value={option.value}
            id={`${idPrefix}-gender-${option.value}`}
            className={cn(
              "group flex h-12 items-center justify-center gap-2.5 rounded-xl border border-input bg-card text-[15px] font-semibold text-muted-foreground shadow-xs outline-none transition",
              "hover:border-border-strong hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/25",
              "data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:text-primary-soft-foreground",
              error && !value && "border-destructive",
            )}
          >
            <span className="grid size-[18px] place-items-center rounded-full border-2 border-current opacity-60 group-data-[state=checked]:opacity-100">
              <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-current" />
            </span>
            {option.label}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
    </div>
  );
}
