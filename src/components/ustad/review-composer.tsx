"use client";

import { Eye, EyeOff, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { deleteReview, saveReview } from "@/lib/actions/admin";
import { actionErrorMessage } from "@/lib/action-error";

type Option = { id: string; label: string };
export type ReviewView = {
  id: string;
  memberId: string;
  memberName: string;
  cycleId: string;
  cycleTitle: string;
  reviewerName: string;
  comment: string;
  isVisibleToMember: boolean;
  updatedAt: string;
  mine: boolean;
};

/** Write or update this reviewer's review for a member + cycle (one per pair, upserted). */
export function ReviewComposer({ members, cycles, mine, initialMemberId, initialCycleId }: { members: Option[]; cycles: Option[]; mine: ReviewView[]; initialMemberId?: string; initialCycleId?: string }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(initialMemberId ?? "");
  const [cycleId, setCycleId] = useState(initialCycleId ?? cycles[0]?.id ?? "");
  const existing = mine.find((review) => review.memberId === memberId && review.cycleId === cycleId);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await saveReview(data);
        toast.success(existing ? "রিভিউ আপডেট হয়েছে।" : "রিভিউ সংরক্ষিত হয়েছে।");
        router.refresh();
      } catch (error) {
        toast.error(actionErrorMessage(error, "রিভিউ সংরক্ষণ করা যায়নি।"));
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="সদস্য" htmlFor="r-member">
        <Select id="r-member" name="memberId" required value={memberId} onChange={(event) => setMemberId(event.target.value)}>
          <option value="">সদস্য নির্বাচন করুন</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="সাইকেল" htmlFor="r-cycle">
        <Select id="r-cycle" name="cycleId" required value={cycleId} onChange={(event) => setCycleId(event.target.value)}>
          {cycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={existing ? "আপনার রিভিউ (আপডেট করুন)" : "রিভিউ ও নসীহত"} htmlFor="r-comment" hint="সদস্যের আমলনামা দেখে উৎসাহ ও সংশোধনের পরামর্শ লিখুন।">
        <Textarea key={`${memberId}:${cycleId}`} id="r-comment" name="comment" required minLength={3} maxLength={3000} defaultValue={existing?.comment ?? ""} className="min-h-36" />
      </Field>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-hairline bg-surface-sunken p-3">
        <input key={`v-${memberId}:${cycleId}`} type="checkbox" name="isVisibleToMember" defaultChecked={existing?.isVisibleToMember ?? true} className="mt-0.5 size-4" />
        <span>
          <span className="block text-sm font-semibold text-foreground">সদস্যকে দেখানো হবে</span>
          <span className="block text-xs leading-5 text-muted-foreground">বন্ধ রাখলে এটি শুধু উস্তাদজির ব্যক্তিগত নোট হিসেবে থাকবে।</span>
        </span>
      </label>
      <Button type="submit" className="w-full" disabled={isPending || !memberId || !cycleId}>
        <Send className="size-4" /> {isPending ? "সংরক্ষণ হচ্ছে…" : existing ? "রিভিউ আপডেট করুন" : "রিভিউ সংরক্ষণ করুন"}
      </Button>
    </form>
  );
}

export function ReviewCard({ review, canDelete }: { review: ReviewView; canDelete: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <article className="surface rounded-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-foreground">{review.memberName}</h3>
          <p className="text-xs text-muted-foreground">
            {review.cycleTitle} • {review.reviewerName} • {new Date(review.updatedAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short" })}
          </p>
        </div>
        <Badge variant={review.isVisibleToMember ? "soft" : "secondary"}>
          {review.isVisibleToMember ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
          {review.isVisibleToMember ? "সদস্য দেখতে পাবেন" : "ব্যক্তিগত নোট"}
        </Badge>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{review.comment}</p>
      <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
        {review.mine ? (
          <Link href={`/dashboard/ustad/reviews?member=${review.memberId}&cycle=${review.cycleId}`} scroll className="inline-flex h-9 items-center rounded-lg bg-primary-soft px-3 text-[13px] font-semibold text-primary-soft-foreground">
            সম্পাদনা
          </Link>
        ) : null}
        {canDelete ? (
          <Button
            size="sm"
            variant="danger-soft"
            disabled={isPending}
            onClick={() => {
              if (!window.confirm("এই রিভিউ মুছে ফেলবেন?")) return;
              startTransition(async () => {
                try {
                  await deleteReview(review.id);
                  toast.success("রিভিউ মুছে ফেলা হয়েছে।");
                  router.refresh();
                } catch (error) {
                  toast.error(actionErrorMessage(error, "মুছে ফেলা যায়নি।"));
                }
              });
            }}
          >
            <Trash2 className="size-3.5" /> মুছুন
          </Button>
        ) : null}
      </div>
    </article>
  );
}
