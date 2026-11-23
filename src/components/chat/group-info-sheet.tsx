"use client";

import { Crown, Info, Loader2, LogOut, Pencil, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { UserPicker, type PickedUser } from "@/components/chat/user-picker";
import { Badge } from "@/components/ui/badge";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { actionErrorMessage } from "@/lib/action-error";
import { addGroupMembers, deleteGroup, leaveGroup, removeGroupMember, renameGroup } from "@/lib/actions/groups";
import type { GroupDetail } from "@/lib/chat-groups";
import { cn } from "@/lib/utils";

/** Header button + sheet: members, add people, rename, leave / delete. */
export function GroupInfoButton({ group, currentUserId, canAdd }: { group: GroupDetail; currentUserId: string; canAdd: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<PickedUser[]>([]);
  const [name, setName] = useState(group.name);
  const [busy, setBusy] = useState<string | null>(null);
  const isCreator = group.createdById === currentUserId;

  async function run(key: string, task: () => Promise<unknown>, success: string, after?: () => void) {
    if (busy) return;
    setBusy(key);
    try {
      await task();
      toast.success(success);
      after?.();
      router.refresh();
    } catch (error) {
      toast.error(actionErrorMessage(error, "কাজটি সম্পন্ন করা যায়নি।"));
    } finally {
      setBusy(null);
    }
  }

  const leave = () => {
    if (window.confirm("আপনি কি এই গ্রুপ ছেড়ে যেতে চান?")) void run("leave", () => leaveGroup(group.id), "গ্রুপ ছেড়েছেন", () => router.push("/dashboard/groups"));
  };
  const remove = () => {
    if (window.confirm("গ্রুপ ও এর সব বার্তা স্থায়ীভাবে মুছে যাবে। নিশ্চিত?")) void run("delete", () => deleteGroup(group.id), "গ্রুপ মুছে ফেলা হয়েছে", () => router.push("/dashboard/groups"));
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="গ্রুপের তথ্য" className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground">
        <Info className="size-5" />
      </button>
      <ResponsiveSheet open={open} onClose={() => setOpen(false)} title={group.name} description={`${group.members.length.toLocaleString("bn-BD")} জন সদস্য`}>
        <div className="space-y-5">
          {group.isAdmin ? (
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run("rename", () => renameGroup({ groupId: group.id, name }), "নাম বদলানো হয়েছে");
              }}
            >
              <label className="sr-only" htmlFor="group-name">গ্রুপের নাম</label>
              <input id="group-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} className="field-3d h-11 min-w-0 flex-1 rounded-xl px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 md:text-sm" />
              <button type="submit" disabled={busy !== null || name.trim() === group.name || name.trim().length < 2} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-active px-4 text-sm font-semibold text-on-active disabled:opacity-50">
                {busy === "rename" ? <Loader2 className="size-4 animate-spin" /> : <Pencil className="size-4" />} সংরক্ষণ
              </button>
            </form>
          ) : null}

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold">সদস্য</h3>
              {group.isAdmin && canAdd ? (
                <button type="button" onClick={() => setAdding((value) => !value)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <UserPlus className="size-4" /> {adding ? "বন্ধ করুন" : "সদস্য যোগ করুন"}
                </button>
              ) : null}
            </div>
            {adding ? (
              <div className="mb-4 space-y-3 rounded-xl border border-hairline p-3">
                <UserPicker selected={picked} onChange={setPicked} excludeIds={group.members.map((member) => member.userId)} />
                <button
                  type="button"
                  disabled={!picked.length || busy !== null}
                  onClick={() => void run("add", () => addGroupMembers({ groupId: group.id, userIds: picked.map((user) => user.id) }), "সদস্য যোগ হয়েছে", () => { setPicked([]); setAdding(false); })}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-active text-sm font-semibold text-on-active disabled:opacity-50"
                >
                  {busy === "add" ? <Loader2 className="size-4 animate-spin" /> : null} {picked.length.toLocaleString("bn-BD")} জনকে যোগ করুন
                </button>
              </div>
            ) : null}
            <ul className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
              {group.members.map((member) => (
                <li key={member.userId} className="flex items-center gap-3 px-3 py-2.5">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold", member.gender === "FEMALE" ? "bg-female-soft text-female" : "bg-primary-soft text-primary")}>{member.name.trim().slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{member.name}{member.userId === currentUserId ? " (আপনি)" : ""}</span>
                  </span>
                  {member.isCreator ? <Badge variant="gold"><Crown className="size-3" /> নির্মাতা</Badge> : member.isAdmin ? <Badge variant="soft">অ্যাডমিন</Badge> : null}
                  {group.isAdmin && !member.isCreator && member.userId !== currentUserId ? (
                    <button
                      type="button"
                      aria-label={`${member.name} কে সরান`}
                      disabled={busy !== null}
                      onClick={() => window.confirm(`${member.name} কে গ্রুপ থেকে সরাবেন?`) && void run(`rm-${member.userId}`, () => removeGroupMember({ groupId: group.id, userId: member.userId }), "সদস্য সরানো হয়েছে")}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
                    >
                      <UserMinus className="size-4" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-col gap-2 border-t border-hairline pt-4 sm:flex-row">
            <button type="button" onClick={leave} disabled={busy !== null} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-hairline text-sm font-semibold text-foreground transition hover:bg-muted">
              <LogOut className="size-4" /> গ্রুপ ছাড়ুন
            </button>
            {isCreator ? (
              <button type="button" onClick={remove} disabled={busy !== null} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-danger-soft text-sm font-semibold text-danger transition hover:brightness-110">
                <Trash2 className="size-4" /> গ্রুপ মুছুন
              </button>
            ) : null}
          </div>
          <p className="text-xs leading-5 text-muted-foreground">গ্রুপের সব বার্তা ৭ দিন পর স্বয়ংক্রিয়ভাবে মুছে যায়।</p>
        </div>
      </ResponsiveSheet>
    </>
  );
}
