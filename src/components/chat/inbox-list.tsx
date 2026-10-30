"use client";

import { MessageSquarePlus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { inboxStamp } from "@/components/chat/format";
import { Badge } from "@/components/ui/badge";
import type { InboxThread } from "@/lib/messages";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string; gender: string };

const toBn = (value: number) => value.toLocaleString("bn-BD");

/** Staff inbox: searchable threads + start a conversation with any member. */
export function InboxList({ threads, members }: { threads: InboxThread[]; members: Member[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => threads.filter((thread) => !q || thread.name.toLowerCase().includes(q)), [threads, q]);
  const withThread = useMemo(() => new Set(threads.map((thread) => thread.memberId)), [threads]);
  const newMembers = useMemo(
    () => (q ? members.filter((member) => !withThread.has(member.id) && member.name.toLowerCase().includes(q)).slice(0, 8) : []),
    [members, q, withThread],
  );

  return (
    <div className="space-y-4">
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

      {filtered.length ? (
        <ul className="overflow-hidden rounded-card border bg-card shadow-card">
          {filtered.map((thread) => (
            <li key={thread.memberId} className="border-b last:border-b-0">
              <Link href={`/dashboard/ustad/messages/${thread.memberId}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-accent/60 active:bg-accent">
                <span
                  className={cn(
                    "grid size-12 shrink-0 place-items-center rounded-full text-base font-bold",
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
                <Link href={`/dashboard/ustad/messages/${member.id}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-accent/60">
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
  );
}
