import Link from "next/link";

import { cn } from "@/lib/utils";

/** Report windows for `/dashboard/amalnama/list` (`?range=`). */
export const RANGE_OPTIONS = [
  { key: "7d", label: "৭ দিন", days: 7 },
  { key: "30d", label: "৩০ দিন", days: 30 },
  { key: "40d", label: "৪০ দিন", days: 40 },
  { key: "90d", label: "৯০ দিন", days: 90 },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

export function parseRange(value: string | string[] | undefined): RangeKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return (RANGE_OPTIONS.find((option) => option.key === raw)?.key ?? "7d") as RangeKey;
}

/** Server-rendered chips; keeps the other query params (search, gender). */
export function RangeFilter({ active, params }: { active: RangeKey; params?: Record<string, string | undefined> }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="group" aria-label="সময় পরিসীমা">
      {RANGE_OPTIONS.map((option) => {
        const query = new URLSearchParams();
        for (const [key, value] of Object.entries(params ?? {})) if (value) query.set(key, value);
        query.set("range", option.key);
        return (
          <Link
            key={option.key}
            href={`/dashboard/amalnama/list?${query.toString()}`}
            aria-current={active === option.key ? "true" : undefined}
            className={cn(
              "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
              active === option.key
                ? "border-primary bg-primary text-on-primary shadow-sm"
                : "border-hairline-strong bg-surface text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
