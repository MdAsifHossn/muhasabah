"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "লাইট", icon: Sun },
  { value: "dark", label: "ডার্ক", icon: Moon },
  { value: "system", label: "ডিভাইস অনুযায়ী", icon: Monitor },
] as const;

const subscribe = () => () => {};

/** Three-way theme choice for the profile page. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <div role="radiogroup" aria-label="থিম" className="grid grid-cols-3 gap-2">
      {options.map((option) => {
        const active = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition",
              active ? "border-primary bg-primary-soft text-primary-soft-foreground" : "border-hairline bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            <option.icon className="size-5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
