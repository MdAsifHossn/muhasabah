import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Primary actions in emerald; press feedback is transform/opacity based so a
 * caller that swaps the colours (`className="bg-amber-400"`) never flashes the
 * wrong hue. Sizes follow the 44px touch-target rule on mobile.
 */
const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:scale-[0.985]",
  {
    variants: {
      variant: {
        default: "bg-emerald-900 text-white shadow-sm hover:bg-emerald-800 hover:shadow-md",
        outline: "border border-hairline-strong bg-white text-stone-800 shadow-xs hover:bg-stone-50",
        ghost: "text-stone-700 hover:bg-stone-100 active:opacity-80",
        soft: "bg-emerald-50 text-emerald-900 shadow-none hover:bg-emerald-100",
        link: "text-emerald-800 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-10 px-4",
        lg: "h-12 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
