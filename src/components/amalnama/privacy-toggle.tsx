"use client";

import { EyeOff, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setHideAmalnama } from "@/lib/actions/privacy";

type Props = { initialHidden: boolean };

/**
 * Optimistic switch: the UI flips immediately, and rolls back if the server
 * action rejects. Only the member's own flag can ever be changed (the action
 * takes no target id).
 */
export function AmalPrivacyToggle({ initialHidden }: Props) {
  const [hidden, setHidden] = useState(initialHidden);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !hidden;
    setHidden(next); // optimistic
    startTransition(async () => {
      try {
        await setHideAmalnama(next);
        toast.success(next ? "আমলনামাটি এখন লুকানো আছে।" : "আমলনামাটি আবার সবার জন্য দৃশ্যমান।");
      } catch (error) {
        setHidden(!next); // rollback
        toast.error(error instanceof Error ? error.message : "প্রাইভেসি পরিবর্তন করা যায়নি।");
      }
    });
  }

  return (
    <div className="w-full space-y-3 sm:w-auto">
      <button
        type="button"
        role="switch"
        aria-checked={hidden}
        aria-labelledby="amalnama-privacy-label"
        onClick={toggle}
        disabled={isPending}
        className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors sm:w-72 ${
          hidden ? "border-emerald-800 bg-emerald-950 text-white" : "border-stone-200 bg-stone-50 text-stone-700"
        } ${isPending ? "opacity-70" : "hover:border-emerald-700"}`}
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          <EyeOff className="size-4" />
          <span id="amalnama-privacy-label">আমার আমলনামা লুকান</span>
        </span>
        <span className="flex items-center gap-2">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              hidden ? "bg-amber-400" : "bg-stone-300"
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
                hidden ? "translate-x-[1.375rem]" : "translate-x-[0.125rem]"
              }`}
            />
          </span>
        </span>
      </button>
      <p className={`text-xs leading-5 ${hidden ? "text-emerald-950" : "text-stone-500"}`}>
        {isPending
          ? "সংরক্ষণ হচ্ছে…"
          : hidden
            ? "চালু: অ্যাডমিন ও উস্তাজি আমার আমলনামা দেখতে বা রিভিউ করতে পারবেন না।"
            : "বন্ধ: অ্যাডমিন ও উস্তাজি আবার দেখতে ও রিভিউ করতে পারবেন।"}
      </p>
    </div>
  );
}
