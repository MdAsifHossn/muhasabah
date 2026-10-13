import Link from "next/link";
import { cn } from "@/lib/utils";

export function Brand({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-950 text-base font-bold text-amber-300 shadow-sm">
        মু
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-base font-bold leading-none tracking-wide text-emerald-950">
            মুহাসাবাহ
          </span>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Muhasabah
          </span>
        </span>
      ) : null}
    </Link>
  );
}
