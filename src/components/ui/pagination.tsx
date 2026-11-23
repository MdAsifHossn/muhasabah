import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { toBanglaDigits } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Page numbers to show: first, last, current ±1, with "…" gaps. */
function buildPages(current: number, total: number): Array<number | "gap"> {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(set).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) result.push("gap");
    result.push(p);
  });
  return result;
}

const cell = "flex h-11 items-center justify-center gap-1.5 text-sm font-semibold transition-colors";

/**
 * Compact segmented pager: [‹ আগের] [১ … ৪ ৫ ৬ … ১০] [পরের ›].
 * On phones the number strip collapses into a single "৫ / ১০" indicator.
 */
export function Pagination({
  page,
  total,
  pageHref,
  summary,
  className,
}: {
  page: number;
  total: number;
  /** Given a target page number, returns the href string. */
  pageHref: (p: number) => string;
  /** Optional line shown under the pager, e.g. "১৯–৩৬ / ১২০টি". */
  summary?: string;
  className?: string;
}) {
  if (total <= 1) return null;
  const pages = buildPages(page, total);
  const hasPrev = page > 1;
  const hasNext = page < total;

  const step = (enabled: boolean, target: number, label: string, children: React.ReactNode, extra: string) =>
    enabled ? (
      <Link href={pageHref(target)} aria-label={label} rel={target < page ? "prev" : "next"} className={cn(cell, "px-3.5 text-foreground hover:bg-primary-soft hover:text-primary sm:px-4", extra)}>
        {children}
      </Link>
    ) : (
      <span aria-hidden="true" className={cn(cell, "px-3.5 text-subtle-foreground opacity-50 sm:px-4", extra)}>
        {children}
      </span>
    );

  return (
    <nav aria-label="পৃষ্ঠা পরিবর্তন" className={cn("flex flex-col items-center gap-2", className)}>
      <div className="inline-flex max-w-full items-stretch divide-x divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
        {step(hasPrev, page - 1, "আগের পৃষ্ঠা", <><ChevronLeft className="size-4" /><span>আগের</span></>, "")}

        <span className="flex h-11 items-center px-4 text-sm font-semibold tabular-nums text-foreground sm:hidden" aria-current="page">
          {toBanglaDigits(page)} <span className="px-1.5 text-subtle-foreground">/</span> {toBanglaDigits(total)}
        </span>

        <ol className="hidden items-stretch divide-x divide-hairline sm:flex">
          {pages.map((p, i) =>
            p === "gap" ? (
              <li key={`gap-${i}`} aria-hidden="true" className={cn(cell, "w-9 text-subtle-foreground")}>…</li>
            ) : (
              <li key={p} className="flex">
                <Link
                  href={pageHref(p)}
                  aria-label={`পৃষ্ঠা ${toBanglaDigits(p)}`}
                  aria-current={p === page ? "page" : undefined}
                  className={cn(cell, "min-w-11 px-2 tabular-nums", p === page ? "bg-active text-on-active" : "text-muted-foreground hover:bg-primary-soft hover:text-primary")}
                >
                  {toBanglaDigits(p)}
                </Link>
              </li>
            ),
          )}
        </ol>

        {step(hasNext, page + 1, "পরের পৃষ্ঠা", <><span>পরের</span><ChevronRight className="size-4" /></>, "")}
      </div>
      {summary ? <p className="text-xs text-muted-foreground">{summary}</p> : null}
    </nav>
  );
}
