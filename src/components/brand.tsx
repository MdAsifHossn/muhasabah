import Link from "next/link";

import { cn } from "@/lib/utils";

/** App mark: emerald tile with a crescent-and-book glyph + wordmark. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("hero-surface grid size-10 shrink-0 place-items-center rounded-xl shadow-sm ring-1 ring-black/5", className)}>
      <svg viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 19.5V6.8c0-.6.4-1.1 1-1.2 2.6-.4 5 .2 7 1.9 2-1.7 4.4-2.3 7-1.9.6.1 1 .6 1 1.2v12.7c-2.7-.5-5.1.1-7 1.6-1.9-1.5-4.3-2.1-7-1.6Z" />
        <path d="M12 7.5v13" />
        <path d="M15.6 2.6a2.3 2.3 0 1 0 2.4 3.1 1.8 1.8 0 0 1-2.4-3.1Z" fill="currentColor" stroke="none" className="text-amber-300" />
      </svg>
    </span>
  );
}

export function Brand({ className, compact = false, href = "/" }: { className?: string; compact?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-bold leading-none text-foreground">মুহাসাবাহ</span>
          <span className="mt-1 block text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">আমল • কুরআন • হাদীস</span>
        </span>
      ) : null}
    </Link>
  );
}
