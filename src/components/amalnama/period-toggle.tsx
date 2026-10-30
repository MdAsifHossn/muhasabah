"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { actionErrorMessage } from "@/lib/action-error";
import { setPeriodDay } from "@/lib/actions/amalnama";
import { cn } from "@/lib/utils";

/**
 * Sisters only: a discreet "শরয়ী ওজরের দিন" switch for the selected day.
 * When on, the server leaves the prayer / tilawat amals out of that day's
 * count (never "missed"). Supervisors only ever see a neutral marker.
 */
export function PeriodToggle({ isPeriod, day, disabled }: { isPeriod: boolean; exemptCount?: number; day: "today" | "yesterday"; disabled?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const dayLabel = day === "yesterday" ? "গতকালের" : "আজকের";

  function toggle() {
    startTransition(async () => {
      try {
        await setPeriodDay(day);
        toast.success(`${dayLabel} হিসাব হালনাগাদ হয়েছে।`);
        router.refresh();
      } catch (error) {
        toast.error(actionErrorMessage(error, "সংরক্ষণ করা যায়নি।"));
      }
    });
  }

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors", isPeriod ? "bg-muted/70" : "bg-card")}>
      <div className="min-w-0 flex-1">
        <label htmlFor="excuse-switch" className="text-sm font-semibold text-foreground">
          শরয়ী ওজরের দিন
        </label>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">চালু করলে নামাজ ও তিলাওয়াতের আমল {day === "yesterday" ? "গতকালের" : "আজকের"} হিসাবে ধরা হবে না।</p>
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-subtle-foreground">
          <Lock className="size-3" /> কারণটি গোপন থাকবে
        </p>
      </div>
      {isPending ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      <Switch id="excuse-switch" checked={isPeriod} onCheckedChange={toggle} disabled={isPending || disabled} aria-label="শরয়ী ওজরের দিন" />
    </div>
  );
}
