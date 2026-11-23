"use client";

import { Loader2, Plus, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { inboxStamp } from "@/components/chat/format";
import { UserPicker, type PickedUser } from "@/components/chat/user-picker";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { actionErrorMessage } from "@/lib/action-error";
import { createGroup } from "@/lib/actions/groups";
import type { GroupSummary } from "@/lib/chat-groups";
import { cn } from "@/lib/utils";

const toBn = (value: number) => value.toLocaleString("bn-BD");

/** Groups the user is in + the "new group" sheet. Selected group is highlighted. */
export function GroupList({ groups, selectedId, canCreate }: { groups: GroupSummary[]; selectedId?: string; canCreate: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<PickedUser[]>([]);
  const [pending, setPending] = useState(false);

  async function create() {
    if (pending) return;
    setPending(true);
    try {
      const { id } = await createGroup({ name, memberIds: picked.map((user) => user.id) });
      toast.success("গ্রুপ তৈরি হয়েছে");
      setOpen(false);
      setName("");
      setPicked([]);
      router.push(`/dashboard/groups?group=${id}`);
      router.refresh();
    } catch (error) {
      toast.error(actionErrorMessage(error, "গ্রুপ তৈরি করা যায়নি।"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-0 space-y-3">
      {canCreate ? (
        <button type="button" onClick={() => setOpen(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-active text-sm font-semibold text-on-active shadow-sm transition hover:brightness-110">
          <Plus className="size-4" /> নতুন গ্রুপ তৈরি করুন
        </button>
      ) : null}

      {groups.length ? (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-card">
          {groups.map((group) => (
            <li key={group.id} className="border-b last:border-b-0">
              <Link href={`/dashboard/groups?group=${group.id}`} className={cn("flex items-center gap-3 px-3 py-3 transition hover:bg-accent/60 active:bg-accent sm:px-4", selectedId === group.id && "bg-primary-soft")}>
                <span className="hero-surface grid size-11 shrink-0 place-items-center rounded-full ring-2 ring-gold/30">
                  <Users className="size-5 text-[#ebe6da]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block truncate text-[15px]", group.unread ? "font-bold" : "font-semibold")}>{group.name}</span>
                  <span className={cn("mt-0.5 block truncate text-sm", group.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {group.lastDeleted ? <em>বার্তাটি মুছে ফেলা হয়েছে</em> : group.lastBody ? `${group.lastSender}: ${group.lastBody}` : `${toBn(group.memberCount)} জন সদস্য`}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={cn("text-xs", group.unread ? "font-semibold text-primary" : "text-subtle-foreground")}>{group.lastBody ? inboxStamp(group.lastAt) : ""}</span>
                  {group.unread ? <span className="grid min-w-6 place-items-center rounded-lg bg-primary px-1.5 text-xs font-bold leading-6 text-primary-foreground">{toBn(group.unread)}</span> : <span className="h-6" />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed bg-card px-5 py-10 text-center text-sm leading-6 text-muted-foreground">
          {canCreate
            ? "এখনো কোনো গ্রুপ নেই। উপরের বোতামে চেপে নিজের পছন্দের সদস্যদের নিয়ে গ্রুপ খুলুন — সবাই বার্তা পাঠাতে, উত্তর দিতে ও প্রতিক্রিয়া জানাতে পারবেন।"
            : "আপনি এখনো কোনো গ্রুপে নেই। উস্তাদজি বা গ্রুপ-নির্মাতা আপনাকে যোগ করলে এখানে দেখতে পাবেন। গ্রুপ খোলার অনুমতি উস্তাদজি দিতে পারেন।"}
        </div>
      )}
      <p className="px-1 text-[11px] leading-5 text-subtle-foreground">জায়গা বাঁচাতে গ্রুপ ও ব্যক্তিগত বার্তা ৭ দিন পর স্বয়ংক্রিয়ভাবে মুছে যায়।</p>

      <ResponsiveSheet
        open={open}
        onClose={() => setOpen(false)}
        title="নতুন গ্রুপ"
        description="নাম দিন ও সদস্য বেছে নিন। পরে আরও সদস্য যোগ করা যাবে।"
        footer={
          <button type="button" onClick={create} disabled={pending || name.trim().length < 2} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-active text-sm font-semibold text-on-active shadow-sm transition hover:brightness-110 disabled:opacity-50">
            {pending ? <Loader2 className="size-4 animate-spin" /> : null} গ্রুপ তৈরি করুন{picked.length ? ` (${toBn(picked.length)} জন যোগ হবেন)` : ""}
          </button>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">গ্রুপের নাম</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="যেমন: কুরআন শিক্ষা হালাকা" className="field-3d h-11 w-full rounded-xl px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 md:text-sm" />
          </label>
          <div className="space-y-1.5">
            <span className="text-sm font-semibold">সদস্য যোগ করুন</span>
            <UserPicker selected={picked} onChange={setPicked} />
          </div>
        </div>
      </ResponsiveSheet>
    </div>
  );
}

