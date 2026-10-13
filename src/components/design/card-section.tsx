import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface CardSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-hand control: a link, a badge, a button… */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Card + section heading in one rhythm: heading row, hairline divider, body.
 * Every dashboard panel uses this so titles, spacing and dividers line up.
 */
export function CardSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: CardSectionProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <Card className={className}>
      <CardContent>
        {hasHeader ? (
          <div className="hairline mb-4 flex items-start justify-between gap-3 pb-3 sm:mb-5 sm:pb-4">
            <div className="min-w-0">
              {title ? (
                <h2 className="text-base font-bold leading-6 text-emerald-950 sm:text-lg">{title}</h2>
              ) : null}
              {description ? <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p> : null}
            </div>
            {action ? <div className="shrink-0 text-sm">{action}</div> : null}
          </div>
        ) : null}
        <div className={cn(contentClassName)}>{children}</div>
      </CardContent>
    </Card>
  );
}
