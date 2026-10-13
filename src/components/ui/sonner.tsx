"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Toasts sit above the app chrome: on phones they are pushed below the sticky
 * top bar (and the safe area), on desktop a little below the top edge.
 * The product is light-only, so the theme is pinned instead of following the
 * OS — a dark toast over the cream canvas would look broken.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      offset={{ top: "1.25rem" }}
      mobileOffset={{ top: "4.5rem", left: "1rem", right: "1rem" }}
      toastOptions={{
        closeButton: true,
        classNames: {
          toast: "font-sans",
          title: "font-semibold",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface-raised)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--hairline)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
