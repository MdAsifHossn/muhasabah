import Link from "next/link";

import { cn } from "@/lib/utils";

/** Available report windows for `/dashboard/amalnama/list` (`?range=`). */
export const RANGE_OPTIONS = [
  { key: "7d", label: "৭ দিন" },
  { key: "1m", label: "১ মাস" },
  { key: "40d", label: "৪০ দিন" },
  { key: "1y", label: "১ বছর" },
  { key: "all", label: "সব সময়" },
] as const;

export type RangeKey = (typeof RANGE_OPTIONS)[number]["key"];

const RANGE_KEYS: string[] = RANGE_OPTIONS.map((option) => option.key);

/** Falls back to the default window (৭ দিন) for unknown/missing values. */
export function parseRange(value: string | string[] | undefined): RangeKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && RANGE_KEYS.includes(raw) ? (raw as RangeKey) : "7d";
}

/** Server-rendered chips — plain links, no client JS needed. */
export function RangeFilter({ active }: { active: RangeKey }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="সময় পরিসীমা নির্বাচন করুন">
      {RANGE_OPTIONS.map((option) => (
        <Link
          key={option.key}
          href={`/dashboard/amalnama/list?range=${option.key}`}
          aria-current={active === option.key ? "true" : undefined}
          className={cn(
            "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition-colors",
            active === option.key
              ? "border-emerald-950 bg-emerald-950 text-white shadow-sm"
              : "border-stone-300 bg-white text-stone-600 hover:border-emerald-700 hover:text-emerald-800",
          )}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}
