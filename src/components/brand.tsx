import Link from "next/link";
import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * App mark: emerald tile, a gold ৮-কোণা তারা (রুবউল হিযব) framing an open
 * book with a flame of নূর above it. Same art as public/images/logo.svg.
 */
export function BrandMark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5", className)}>
      <svg viewBox="0 0 512 512" className="size-full" aria-hidden>
        <defs>
          <radialGradient id={`${id}bg`} cx="50%" cy="38%" r="75%">
            <stop offset="0" stopColor="#11865f" />
            <stop offset="0.55" stopColor="#0a5c43" />
            <stop offset="1" stopColor="#043328" />
          </radialGradient>
          <linearGradient id={`${id}gd`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8e3a8" />
            <stop offset="0.5" stopColor="#e3b25a" />
            <stop offset="1" stopColor="#c38f32" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" fill={`url(#${id}bg)`} />
        <g fill="#e3b25a" fillOpacity="0.1" stroke={`url(#${id}gd)`} strokeWidth="20" strokeLinejoin="round">
          <rect x="128" y="128" width="256" height="256" rx="10" />
          <rect x="128" y="128" width="256" height="256" rx="10" transform="rotate(45 256 256)" />
        </g>
        <path d="M256 146c20 24 29 41 29 56a29 29 0 0 1-58 0c0-15 9-32 29-56z" fill={`url(#${id}gd)`} />
        <path d="M256 250c-26-18-58-22-90-16v104c32-6 64-2 90 16z" fill="#fff" />
        <path d="M256 250c26-18 58-22 90-16v104c-32-6-64-2-90 16z" fill="#fff" />
        <path d="M256 252v100" stroke="#0a5c43" strokeWidth="8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Brand({ className, compact = false, href = "/" }: { className?: string; compact?: boolean; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5", className)} aria-label="মুহাসাবাহ — হোম">
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
