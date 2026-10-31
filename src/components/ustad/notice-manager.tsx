"use client";

import { AmalAudience } from "@prisma/client";
import { Megaphone, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Sheet } from "@/components/ustad/sheet";
import { createNotice, deleteNotice, toggleNoticePin, updateNotice } from "@/lib/actions/notices";
import { actionErrorMessage } from "@/lib/action-error";

export type NoticeView = {
  id: string;
  title: string;
  body: string;
  audience: AmalAudience;
  pinned: boolean;
  authorName: string;
  createdAt: string;
  canManage: boolean;
};

const audienceText: Record<AmalAudience, string> = { ALL: "সবার জন্য", MALE: "ভাইদের জন্য", FEMALE: "বোনদের জন্য" };
const audienceVariant = { ALL: "soft", MALE: "info", FEMALE: "female" } as const;

export function NoticeComposer({ initial, onDone }: { initial?: NoticeView; onDone?: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        if (initial) {
          data.set("noticeId", initial.id);
          await updateNotice(data);
          toast.success("নোটিশ আপডেট হয়েছে।");
          onDone?.();
        } else {
          await createNotice(data);
          toast.success("নোটিশ প্রকাশিত হয়েছে।");
          formRef.current?.reset();
        }
        router.refresh();
      } catch (error) {
        toast.error(actionErrorMessage(error, "নোটিশ প্রকাশ করা যায়নি।"));
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4">
      {initial ? <input type="hidden" name="noticeId" value={initial.id} /> : null}
      <Field label="শিরোনাম" htmlFor="n-title">
        <Input id="n-title" name="title" required minLength={2} maxLength={140} defaultValue={initial?.title} placeholder="যেমন: এই শুক্রবার বিশেষ হালাকা" />
      </Field>
      <Field label="বিস্তারিত" htmlFor="n-body">
        <Textarea id="n-body" name="body" required minLength={2} maxLength={4000} defaultValue={initial?.body} className="min-h-36" placeholder="সদস্যদের উদ্দেশে আপনার বার্তা…" />
      </Field>
      <Field label="কারা দেখবেন" htmlFor="n-aud">
        <Select id="n-aud" name="audience" defaultValue={initial?.audience ?? AmalAudience.ALL}>
          <option value={AmalAudience.ALL}>সবাই</option>
          <option value={AmalAudience.MALE}>শুধু ভাইয়েরা</option>
          <option value={AmalAudience.FEMALE}>শুধু বোনেরা</option>
        </Select>
      </Field>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-hairline bg-surface-sunken p-3 text-sm font-semibold text-foreground">
        <input type="checkbox" name="pinned" defaultChecked={initial?.pinned} className="size-4" />
        উপরে পিন করে রাখুন
      </label>
      <Button type="submit" className="w-full" disabled={isPending}>
        <Megaphone className="size-4" /> {isPending ? "সংরক্ষণ হচ্ছে…" : initial ? "নোটিশ আপডেট করুন" : "নোটিশ প্রকাশ করুন"}
      </Button>
    </form>
  );
}

export function NoticeCard({ notice }: { notice: NoticeView }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run(task: () => Promise<void>, message: string) {
    startTransition(async () => {
      try {
        await task();
        toast.success(message);
        router.refresh();
      } catch (error) {
        toast.error(actionErrorMessage(error, "কাজটি সম্পন্ন হয়নি।"));
      }
    });
  }

  return (
    <article className={notice.pinned ? "surface rounded-card border-l-4 border-l-gold p-4" : "surface rounded-card p-4"}>
      <div className="flex flex-wrap items-center gap-1.5">
        {notice.pinned ? (
          <Badge variant="gold">
            <Pin className="size-3" /> পিন করা
          </Badge>
        ) : null}
        <Badge variant={audienceVariant[notice.audience]}>{audienceText[notice.audience]}</Badge>
      </div>
      <h3 className="mt-2 text-base font-bold text-foreground">{notice.title}</h3>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-7 text-foreground/90">{notice.body}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {notice.authorName} • {new Date(notice.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      {notice.canManage ? (
        <div className="mt-3 flex gap-2 border-t border-hairline pt-3">
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" /> সম্পাদনা
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={() => run(() => toggleNoticePin(notice.id), notice.pinned ? "পিন সরানো হয়েছে।" : "নোটিশ পিন করা হয়েছে।")}>
            {notice.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {notice.pinned ? "পিন সরান" : "পিন করুন"}
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            disabled={isPending}
            onClick={() => window.confirm("এই নোটিশ মুছে ফেলবেন?") && run(() => deleteNotice(notice.id), "নোটিশ মুছে ফেলা হয়েছে।")}
          >
            <Trash2 className="size-3.5" /> মুছুন
          </Button>
        </div>
      ) : null}
      {notice.canManage ? (
        <Sheet open={editing} onClose={() => setEditing(false)} title="নোটিশ সম্পাদনা" description="প্রকাশিত নোটিশের তথ্য সংশোধন করুন।">
          <NoticeComposer initial={notice} onDone={() => setEditing(false)} />
        </Sheet>
      ) : null}
    </article>
  );
}
