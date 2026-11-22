import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Link from "next/link";

import { toBanglaDigits } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Build the page numbers to show: always first, last, current ±2, with "…" gaps. */
function buildPages(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) set.add(p);
  }
  const sorted = Array.from(set).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  for (let i = 0; i < sorted.length; i++) {
    result.push(sorted[i]);
    if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) {
      result.push("gap");
    }
  }
  return result;
}

/** Professional pagination bar with first/prev/page-numbers/next/last. */
export function Pagination({
  page,
  total,
  pageHref,
  className,
}: {
  page: number;
  total: number;
  /** Given a target page number, returns the href string. */
  pageHref: (p: number) => string;
  className?: string;
}) {
  if (total <= 1) return null;

  const pages = buildPages(page, total);

  const btn =
    "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border border-hairline bg-surface px-2.5 text-sm font-semibold shadow-xs transition";
  const btnActive = "bg-primary text-on-primary border-primary shadow-sm";
  const btnMuted =
    "text-muted-foreground hover:bg-surface-sunken hover:text-foreground";
  const btnDisabled =
    "pointer-events-none opacity-35 text-muted-foreground";

  return (
    <nav
      aria-label="পৃষ্ঠা"
      className={cn("flex flex-wrap items-center justify-center gap-1.5", className)}
    >
      {/* First */}
      <Link
        href={page > 1 ? pageHref(1) : "#"}
        aria-label="প্রথম পৃষ্ঠা"
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : 0}
        className={cn(btn, page <= 1 ? btnDisabled : btnMuted)}
      >
        <ChevronsLeft className="size-4" />
      </Link>

      {/* Prev */}
      <Link
        href={page > 1 ? pageHref(page - 1) : "#"}
        aria-label="আগের পৃষ্ঠা"
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : 0}
        className={cn(btn, page <= 1 ? btnDisabled : btnMuted)}
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">আগের</span>
      </Link>

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "gap" ? (
          <span
            key={`gap-${i}`}
            className="flex h-10 w-6 items-end justify-center pb-1.5 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p)}
            aria-label={`পৃষ্ঠা ${toBanglaDigits(p)}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(btn, p === page ? btnActive : btnMuted)}
          >
            {toBanglaDigits(p)}
          </Link>
        ),
      )}

      {/* Next */}
      <Link
        href={page < total ? pageHref(page + 1) : "#"}
        aria-label="পরের পৃষ্ঠা"
        aria-disabled={page >= total}
        tabIndex={page >= total ? -1 : 0}
        className={cn(btn, page >= total ? btnDisabled : btnMuted)}
      >
        <span className="hidden sm:inline">পরের</span>
        <ChevronRight className="size-4" />
      </Link>

      {/* Last */}
      <Link
        href={page < total ? pageHref(total) : "#"}
        aria-label="শেষ পৃষ্ঠা"
        aria-disabled={page >= total}
        tabIndex={page >= total ? -1 : 0}
        className={cn(btn, page >= total ? btnDisabled : btnMuted)}
      >
        <ChevronsRight className="size-4" />
      </Link>
    </nav>
  );
}
