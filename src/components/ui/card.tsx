import * as React from "react";

import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a gentle hover lift — only for cards that behave like a link/button. */
  interactive?: boolean;
}

/**
 * The base panel of the design system.
 *
 * Depth & shape come from the global tokens (`shadow-sm` = the warm card
 * shadow, `rounded-2xl` = the 16px "card" tier, `border-hairline` = the warm
 * 1px rule). Everything is written so a caller's `className` still wins —
 * e.g. `<Card className="border-emerald-900/20 shadow-lg">` merges cleanly.
 */
export function Card({ className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-hairline bg-surface shadow-sm text-foreground transition",
        interactive &&
          "hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-md active:translate-y-0 active:scale-[0.995]",
        className,
      )}
      {...props}
    />
  );
}

/** Title row for a card. Sits above `CardContent` with no double padding. */
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 px-5 pt-5 sm:px-6 sm:pt-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-bold leading-6 text-emerald-950 sm:text-lg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-stone-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 px-5 pb-5 sm:px-6 sm:pb-6", className)} {...props} />
  );
}
