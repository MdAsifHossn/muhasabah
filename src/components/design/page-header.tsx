import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export interface PageHeaderProps {
  /** Small kicker above the title (a cycle name, a section, …). */
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Primary action — a link button, right-aligned on desktop. */
  action?: { label: string; href: string };
  /** Free-form actions (buttons, forms) rendered beside / under the title. */
  actions?: ReactNode;
  /** Optional chips / counters under the description. */
  meta?: ReactNode;
}

/** One header for every dashboard screen: kicker → title → context → chips → actions. */
export function PageHeader({ eyebrow, title, description, action, actions, meta }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-primary">
            <span aria-hidden className="h-px w-5 shrink-0 bg-primary/50" />
            <span className="truncate">{eyebrow}</span>
          </p>
        ) : null}
        <h1 className="mt-1.5 text-[1.6rem] font-bold leading-tight text-foreground sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {action || actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          {actions}
          {action ? (
            <Button asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
