"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { textareaClass } from "@/components/dashboard/common";
import { addAmalComment } from "@/lib/actions/amalnama";
import { actionErrorMessage } from "@/lib/action-error";

/**
 * Ustadh/Admin feedback box shown at the bottom of a member's report.
 * Failures (e.g. the member hid their Amalnama → 403) surface the server's
 * Bengali message in a toast instead of a raw 500.
 */
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
        if (!comment) {
          toast.error("মন্তব্য লিখুন।");
          return;
        }
        startTransition(async () => {
          const formData = new FormData();
          formData.set("memberId", memberId);
          formData.set("comment", comment);
          try {
            await addAmalComment(formData);
            toast.success(`${memberName} এর জন্য মন্তব্য যোগ হয়েছে।`);
            setText("");
            router.refresh();
          } catch (error) {
            toast.error(actionErrorMessage(error, "মন্তব্য জমা দেওয়া যায়নি।"));
          }
        });
      }}
    >
      <textarea
        value={text}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setText(event.target.value)}
        placeholder="আমল সম্পর্কে পরামর্শ দিন…"
        rows={2}
        className={textareaClass}
      />
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "পাঠানো হচ্ছে…" : "মন্তব্য পাঠান"}
      </Button>
    </form>
  );
}
