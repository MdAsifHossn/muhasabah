"use client";

import { Loader2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteDailyAmalnama } from "@/lib/actions/amalnama";
import { actionErrorMessage } from "@/lib/action-error";

export function DailyEntryActions({ entryId, memberId, dateKey }: { entryId: string | null; memberId: string; dateKey: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!entryId) return;
    if (!window.confirm("এই দিনের আমলনামা সম্পূর্ণ মুছে ফেলবেন? পরে এটি আবার নতুন করে তৈরি করা যাবে।")) return;
    startTransition(async () => {
      try {
        await deleteDailyAmalnama(entryId);
        toast.success("এই দিনের আমলনামা মুছে ফেলা হয়েছে।");
        router.refresh();
      } catch (error) {
        toast.error(actionErrorMessage(error, "আমলনামা মুছতে পারিনি।"));
      }
    });
  }

  return (
    <span className="flex shrink-0 items-center gap-1">
      <Link
        href={`/dashboard/amalnama?member=${memberId}&date=${dateKey}`}
        className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-primary-soft hover:text-primary"
        aria-label="এই দিনের আমলনামা সম্পাদনা করুন"
        title="সম্পাদনা"
      >
        <Pencil className="size-3.5" />
      </Link>
      {entryId ? <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="grid size-7 place-items-center rounded-lg text-muted-foreground transition hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        aria-label="এই দিনের আমলনামা মুছুন"
        title="মুছে ফেলুন"
      >
        {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </button> : null}
    </span>
  );
}
