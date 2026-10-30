import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional call to action, already rendered (link, form, button…). */
  action?: React.ReactNode;
  className?: string;
}

/** Quiet, centred "nothing here yet" panel with a predictable height. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("surface rounded-card px-5 py-10 text-center sm:py-12", className)}>
      {Icon ? (
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <h2 className="mt-4 text-base font-bold text-foreground sm:text-lg">{title}</h2>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

/** Single shimmering block. Always give it an explicit size so nothing shifts. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-surface-sunken", className)} />;
}

/** Loading stand-in shaped like a list of cards. */
export function PanelSkeleton({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-live="polite" className={cn("space-y-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="surface rounded-card p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
