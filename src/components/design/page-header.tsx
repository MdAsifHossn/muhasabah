import Link from "next/link";

import { Button } from "@/components/ui/button";

export interface PageHeaderProps {
  /** Small kicker above the title (a cycle name, a section, …). */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Primary action — rendered as a real button, right-aligned on desktop. */
  action?: { label: string; href: string };
  /** Optional chips / counters under the description. */
  meta?: React.ReactNode;
}

/**
 * One page header for the whole dashboard so every screen opens the same way:
 * kicker → title → one-line context → optional chips → optional action.
 */
export function PageHeader({ eyebrow, title, description, action, meta }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            <span aria-hidden className="h-px w-5 shrink-0 bg-emerald-300" />
            <span className="truncate">{eyebrow}</span>
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold leading-tight text-emerald-950 sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">{description}</p>
        ) : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {action ? (
        <div className="shrink-0">
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        </div>
      ) : null}
    </header>
  );
}
