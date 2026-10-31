"use client";

import { MessageSquarePlus, Search, UsersRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { inboxStamp } from "@/components/chat/format";
import { Badge } from "@/components/ui/badge";
import type { InboxThread } from "@/lib/messages";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string; gender: string };

const toBn = (value: number) => value.toLocaleString("bn-BD");

/** Staff inbox: searchable threads + start a conversation with any member. */
export function InboxList({ threads, members, selectedMemberId, compact = false }: { threads: InboxThread[]; members: Member[]; selectedMemberId?: string; compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () => threads.filter((thread) => (!q || thread.name.toLowerCase().includes(q)) && (filter === "all" || thread.unread > 0)),
    [threads, q, filter],
  );
  const withThread = useMemo(() => new Set(threads.map((thread) => thread.memberId)), [threads]);
  const newMembers = useMemo(
    () => (q ? members.filter((member) => !withThread.has(member.id) && member.name.toLowerCase().includes(q)).slice(0, 8) : []),
    [members, q, withThread],
  );

  return (
    <div className="space-y-4">
      {!compact ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card px-4 py-3 shadow-xs">
            <p className="text-xs text-muted-foreground">কথোপকথন</p>
            <p className="mt-1 text-xl font-bold text-foreground">{toBn(threads.length)}</p>
          </div>
          <div className="rounded-2xl border bg-card px-4 py-3 shadow-xs">
            <p className="text-xs text-muted-foreground">নতুন বার্তা</p>
            <p className="mt-1 text-xl font-bold text-primary">{toBn(threads.reduce((sum, thread) => sum + thread.unread, 0))}</p>
          </div>
          <div className="rounded-2xl border bg-primary-soft px-4 py-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-primary-soft-foreground"><UsersRound className="size-4" /> সক্রিয় সদস্য</div>
            <p className="mt-1 text-xl font-bold text-primary">{toBn(members.length)}</p>
          </div>
        </div>
      ) : null}

      <div className={cn(compact && "rounded-card border bg-card p-3 shadow-card sm:p-4")}>
        {compact ? (
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-foreground">সদস্য</h2>
              <p className="text-xs text-muted-foreground">{toBn(members.length)} জন সক্রিয় সদস্য</p>
            </div>
            <Badge variant="secondary">{toBn(threads.reduce((sum, thread) => sum + thread.unread, 0))} নতুন</Badge>
          </div>
        ) : null}
        <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle-foreground" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="সদস্যের নাম খুঁজুন…"
          aria-label="সদস্য খুঁজুন"
          className="h-12 w-full rounded-2xl border border-input bg-card pl-11 pr-4 text-base shadow-xs outline-none transition placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 md:text-sm"
        />
      </div>

        <div className="mt-3 flex gap-1 rounded-xl bg-surface-sunken p-1">
          <button type="button" onClick={() => setFilter("all")} className={cn("flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition", filter === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>সব কথোপকথন <span className="ml-1 text-[10px]">{toBn(threads.length)}</span></button>
          <button type="button" onClick={() => setFilter("unread")} className={cn("flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition", filter === "unread" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>নতুন বার্তা <span className="ml-1 text-[10px]">{toBn(threads.filter((thread) => thread.unread > 0).length)}</span></button>
        </div>

        {!compact ? <p className="mt-3 px-1 text-xs text-muted-foreground">নাম লিখে আগের কথোপকথন খুঁজুন, অথবা নতুন সদস্যের সঙ্গে আলাদা কথোপকথন শুরু করুন।</p> : null}

      {filtered.length ? (
        <ul className={cn("overflow-hidden rounded-card border bg-card shadow-card", compact && "mt-3") }>
          {filtered.map((thread) => (
            <li key={thread.memberId} className="border-b last:border-b-0">
              <Link href={`/dashboard/ustad/messages?member=${thread.memberId}`} className={cn("flex items-center gap-3 px-3 py-3 transition hover:bg-accent/60 active:bg-accent sm:px-4", selectedMemberId === thread.memberId && "bg-primary-soft")}>
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold sm:size-11",
                    thread.gender === "FEMALE" ? "bg-female-soft text-female" : "bg-primary-soft text-primary",
                  )}
                >
                  {thread.name.trim().slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("truncate text-[15px]", thread.unread ? "font-bold" : "font-semibold")}>{thread.name}</span>
                    {thread.gender === "FEMALE" ? <Badge variant="female">বোন</Badge> : thread.gender === "MALE" ? <Badge variant="soft">ভাই</Badge> : null}
                    {!thread.isActive ? <Badge variant="secondary">নিষ্ক্রিয়</Badge> : null}
                  </span>
                  <span className={cn("mt-0.5 block truncate text-sm", thread.unread ? "font-medium text-foreground" : "text-muted-foreground")}>
                    {thread.lastFromStaff ? "আপনি/উস্তাদজি: " : ""}
                    {thread.lastDeleted ? <em>বার্তাটি মুছে ফেলা হয়েছে</em> : thread.lastBody}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className={cn("text-xs", thread.unread ? "font-semibold text-primary" : "text-subtle-foreground")}>{inboxStamp(thread.lastAt)}</span>
                  {thread.unread ? (
                    <span className="grid min-w-6 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold leading-6 text-primary-foreground">{toBn(thread.unread)}</span>
                  ) : (
                    <span className="h-6" />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-dashed bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          {q ? "এই নামে কোনো কথোপকথন নেই।" : "এখনো কোনো সদস্য বার্তা পাঠাননি। উপরে নাম খুঁজে নিজেই কথা শুরু করতে পারেন।"}
        </div>
      )}

      {newMembers.length ? (
        <div>
          <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">নতুন কথোপকথন শুরু করুন</p>
          <ul className="overflow-hidden rounded-card border bg-card">
            {newMembers.map((member) => (
              <li key={member.id} className="border-b last:border-b-0">
                <Link href={`/dashboard/ustad/messages?member=${member.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent/60">
                  <MessageSquarePlus className="size-5 text-primary" />
                  <span className="flex-1 truncate font-medium">{member.name}</span>
                  {member.gender === "FEMALE" ? <Badge variant="female">বোন</Badge> : member.gender === "MALE" ? <Badge variant="soft">ভাই</Badge> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      </div>
    </div>
  );
}
