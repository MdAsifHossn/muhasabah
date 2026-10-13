"use client";

import { Droplets } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setPeriodDay } from "@/lib/actions/amalnama";
import { actionErrorMessage } from "@/lib/action-error";
import { cn } from "@/lib/utils";

/**
 * "আজ আমার মাসিক চলছে" — the member's own, reversible toggle for today.
 *
 * On a period day the amals flagged "মাসিকের দিনে প্রযোজ্য নয়" (namaz, roja…)
 * disappear from the daily form, the grid shows them as "—" and they are
 * never counted as missed. Everything else (যিকির, তরজমা, বই, সেবা…) stays
 * normal. Only female members ever see this control.
 */
export function PeriodToggle({ initialIsPeriod, exemptCount }: { initialIsPeriod: boolean; exemptCount: number }) {
  const [isPeriod, setIsPeriod] = useState(initialIsPeriod);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        await setPeriodDay();
        setIsPeriod((value) => !value);
        toast.success("আজকের মাসিকের তথ্য সংরক্ষিত হয়েছে।");
      } catch (error) {
        toast.error(actionErrorMessage(error, "তথ্যটি সংরক্ষণ করা যায়নি।"));
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors sm:p-5",
        isPeriod ? "border-rose-300 bg-rose-50" : "border-stone-200 bg-white",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={cn("grid size-10 shrink-0 place-items-center rounded-2xl", isPeriod ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700")}>
            <Droplets className="size-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-emerald-950">আজ আমার মাসিক চলছে</p>
            <p className="mt-0.5 text-xs leading-5 text-stone-500">
              {exemptCount > 0
                ? `এই দিনে নামাজ ও রোজার ${exemptCount}টি আমল প্রযোজ্য নয় — সেগুলো আজকের তালিকা ও হিসাব থেকে বাদ যাবে এবং মিস ধরা হবে না।`
                : "এই দিনে নামাজ ও রোজার আমল প্রযোজ্য নয় — সেগুলো মিস হিসেব গণনা করা হবে না।"}
              {" "}যিকির, তরজমা, বই ও সেবার আমল যথাযথভাবে গণনা হবে।
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={isPending}
          aria-pressed={isPeriod}
          className={cn(
            "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors disabled:opacity-60",
            isPeriod
              ? "border-rose-600 bg-rose-600 text-white hover:bg-rose-700"
              : "border-stone-300 bg-white text-stone-700 hover:border-rose-400 hover:text-rose-700",
          )}
        >
          {isPending ? "সংরক্ষণ হচ্ছে…" : isPeriod ? "আজকের তথ্য সরান" : "হ্যাঁ, চালু করুন"}
        </button>
      </div>
      {isPeriod ? (
        <p className="mt-3 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold leading-5 text-rose-800">
          আজকের দিনে মাসিক হিসেবে চিহ্নিত করা হয়েছে। ভুল হলে আবার একই বাটনে চেপে সরিয়ে নিন।
        </p>
      ) : null}
    </div>
  );
}
