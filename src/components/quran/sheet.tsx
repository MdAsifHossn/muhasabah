"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

/**
 * Bottom sheet on phones, centred dialog on wider screens.
 *
 * `variant="panel"` additionally docks the surface to the RIGHT edge on `lg+`
 * (desktop audio/reciter panel) while keeping the exact same bottom-sheet
 * behaviour below `lg`. The reading area behind it keeps its own scroll — the
 * sheet never resizes the reader chrome.
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
  variant = "modal",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** "modal" = centred dialog on desktop, "panel" = right-hand side panel on desktop. */
  variant?: "modal" | "panel";
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center sm:items-center",
        variant === "panel" && "lg:justify-end lg:pr-6",
      )}
    >
      <button
        type="button"
        aria-label="বন্ধ করুন"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-emerald-950/50 backdrop-blur-[2px]",
          variant === "panel" && "lg:bg-emerald-950/25",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl",
          // Desktop: a floating, full-height side panel docked to the right.
          variant === "panel" && "lg:my-6 lg:max-h-none lg:h-[calc(100%-3rem)] lg:w-80 lg:max-w-[85vw]",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-5 py-3">
          <h2 className="min-w-0 truncate text-base font-black text-emerald-950">{title}</h2>
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={onClose}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-stone-500 transition-colors active:bg-stone-100 lg:hover:bg-stone-100 lg:hover:text-emerald-950"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export function sheetButtonClass(active: boolean) {
  return cn(
    "min-h-11 cursor-pointer rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
    active
      ? "bg-emerald-950 text-white shadow"
      : "bg-white text-stone-600 border border-stone-200 active:bg-stone-50 lg:hover:border-emerald-300 lg:hover:bg-emerald-50 lg:hover:text-emerald-950",
  );
}
