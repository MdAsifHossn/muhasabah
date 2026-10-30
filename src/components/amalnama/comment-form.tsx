"use client";

import { Loader2, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { actionErrorMessage } from "@/lib/action-error";
import { addAmalComment, deleteAmalComment } from "@/lib/actions/amalnama";

/** Ustadh/Admin feedback box under a member's report. */
export function CommentForm({ memberId, memberName }: { memberId: string; memberName: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const comment = text.trim();
        if (comment.length < 2) {
          toast.error("অন্তত ২ অক্ষরের মন্তব্য লিখুন।");
          return;
        }
        startTransition(async () => {
          const formData = new FormData();
          formData.set("memberId", memberId);
          formData.set("comment", comment);
          try {
            await addAmalComment(formData);
            toast.success(`${memberName}-এর জন্য মন্তব্য যোগ হয়েছে।`);
            setText("");
            router.refresh();
          } catch (error) {
            toast.error(actionErrorMessage(error, "মন্তব্য জমা দেওয়া যায়নি।"));
          }
        });
      }}
    >
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={`${memberName}-কে পরামর্শ বা উৎসাহ দিন…`}
        rows={2}
        maxLength={1000}
        className="min-h-20"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {isPending ? "পাঠানো হচ্ছে…" : "মন্তব্য পাঠান"}
      </Button>
    </form>
  );
}

export function CommentDeleteButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="মন্তব্য মুছুন"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("মন্তব্যটি মুছে ফেলবেন?")) return;
        startTransition(async () => {
          try {
            await deleteAmalComment(commentId);
            toast.success("মন্তব্য মুছে ফেলা হয়েছে।");
            router.refresh();
          } catch (error) {
            toast.error(actionErrorMessage(error, "মন্তব্য মোছা যায়নি।"));
          }
        });
      }}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-danger-soft hover:text-danger disabled:opacity-50"
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
