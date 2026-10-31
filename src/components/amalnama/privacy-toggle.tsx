"use client";

import { EyeOff, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { actionErrorMessage } from "@/lib/action-error";
import { setHideAmalnama } from "@/lib/actions/privacy";
import { cn } from "@/lib/utils";

/** Optimistic switch for the member's own "hide my Amalnama" flag (rolls back on failure). */
export function AmalPrivacyToggle({ initialHidden }: { initialHidden: boolean }) {
  const [hidden, setHidden] = useState(initialHidden);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !hidden;
    setHidden(next);
    startTransition(async () => {
      try {
        await setHideAmalnama(next);
        toast.success(next ? "আমলনামা এখন গোপন।" : "আমলনামা আবার উস্তাদজির কাছে দৃশ্যমান।");
      } catch (error) {
        setHidden(!next);
        toast.error(actionErrorMessage(error, "প্রাইভেসি পরিবর্তন করা যায়নি।"));
      }
    });
  }

  return (
    <div className="w-full space-y-2 sm:w-auto">
      <button
        type="button"
        role="switch"
        aria-checked={hidden}
        onClick={toggle}
        disabled={isPending}
        className={cn(
          "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors sm:w-72",
          hidden ? "border-primary bg-primary-soft text-primary-soft-foreground" : "border-hairline bg-surface-sunken text-foreground",
          isPending && "opacity-70",
        )}
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <EyeOff className="size-4" /> আমার আমলনামা গোপন রাখুন
        </span>
        <span className="flex items-center gap-2">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          <span className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors", hidden ? "bg-primary" : "bg-hairline-strong")}>
            <span className={cn("inline-block size-5 rounded-full bg-white shadow transition-transform", hidden ? "translate-x-[1.375rem]" : "translate-x-0.5")} />
          </span>
        </span>
      </button>
      <p className="text-xs leading-5 text-muted-foreground">
        {hidden ? "চালু: উস্তাদজি আপনার আমলনামা দেখতে বা মন্তব্য করতে পারবেন না।" : "বন্ধ: উস্তাদজি আপনার আমলনামা দেখে পরামর্শ দিতে পারবেন।"}
      </p>
    </div>
  );
}
