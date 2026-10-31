"use client";

import { Gender } from "@prisma/client";
import { AlertTriangle, LayoutGrid, Lock, MessageSquarePlus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Segmented } from "@/components/ustad/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type BoardMember = {
  id: string;
  name: string;
  gender: Gender;
  hidden: boolean;
  /** Submitted today? (null when hidden) */
  todayStatus: "submitted" | "draft" | "none" | null;
  todayPercent: number | null;
  weekPercent: number | null;
  /** Bengali-formatted date of the last submission, or null. */
  lastSubmitted: string | null;
  needsAttention: boolean;
  /** Last 7 days, oldest first: percentage or null (no submission). */
  spark: (number | null)[];
};

type Filter = "all" | "MALE" | "FEMALE" | "attention" | "pending";

function percentTone(value: number) {
  if (value >= 75) return "text-success";
  if (value >= 40) return "text-warning";
  return "text-danger";
}

export function MemberBoard({ members }: { members: BoardMember[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => {
      if (needle && !member.name.toLowerCase().includes(needle)) return false;
      if (filter === "MALE" || filter === "FEMALE") return member.gender === filter;
      if (filter === "attention") return member.needsAttention;
      if (filter === "pending") return !member.hidden && member.todayStatus !== "submitted";
      return true;
    });
  }, [members, query, filter]);

  const count = (predicate: (member: BoardMember) => boolean) => members.filter(predicate).length;

  return (
    <div className="space-y-3">
      <div className="surface space-y-3 rounded-card p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="সদস্যের নাম খুঁজুন" className="pl-9" aria-label="সদস্য খুঁজুন" />
        </div>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "সবাই", count: members.length },
            { value: "pending", label: "আজ বাকি", count: count((m) => !m.hidden && m.todayStatus !== "submitted") },
            { value: "attention", label: "মনোযোগ দরকার", count: count((m) => m.needsAttention) },
            { value: "MALE", label: "ভাইয়েরা", count: count((m) => m.gender === Gender.MALE) },
            { value: "FEMALE", label: "বোনেরা", count: count((m) => m.gender === Gender.FEMALE) },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="surface rounded-card p-8 text-center text-sm text-muted-foreground">এই তালিকায় কোনো সদস্য নেই।</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((member) => (
            <li key={member.id} className="surface rounded-2xl p-2.5 sm:p-3">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                    member.gender === Gender.FEMALE ? "bg-female-soft text-female" : "bg-primary-soft text-primary",
                  )}
                >
                  {member.name.trim().slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/amalnama/grid?member=${member.id}&days=7`} className="truncate text-sm font-bold text-foreground hover:text-primary">{member.name}</Link>
                    {member.needsAttention ? <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-label="মনোযোগ দরকার" /> : null}
                  </div>
                  {member.hidden ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="size-3.5" /> সদস্য আমলনামা গোপন রেখেছেন
                    </p>
                  ) : (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {member.todayStatus === "submitted" ? (
                        <Badge variant="soft">আজ জমা • {member.todayPercent?.toLocaleString("bn-BD")}%</Badge>
                      ) : member.todayStatus === "draft" ? (
                        <Badge variant="warning">আজ খসড়া</Badge>
                      ) : (
                        <Badge variant="secondary">আজ এখনও জমা নেই</Badge>
                      )}
                      <span className="text-[10px] text-subtle-foreground">শেষ জমা: {member.lastSubmitted ?? "কখনো নয়"}</span>
                    </div>
                  )}
                </div>
                {!member.hidden && member.weekPercent !== null ? (
                  <div className="shrink-0 text-right">
                    <p className={cn("text-lg font-bold tabular-nums", percentTone(member.weekPercent))}>{member.weekPercent.toLocaleString("bn-BD")}%</p>
                    <p className="text-[10px] text-subtle-foreground">৭ দিনের গড়</p>
                  </div>
                ) : null}
              </div>

              {!member.hidden ? (
                <>
                  <div className="mt-2 flex h-5 items-end gap-1" aria-label="গত ৭ দিন">
                    {member.spark.map((value, index) => (
                      <span
                        key={index}
                        className={cn("flex-1 rounded-sm", value === null ? "h-1 bg-hairline-strong" : value >= 75 ? "bg-success" : value >= 40 ? "bg-warning" : "bg-danger")}
                        style={value === null ? undefined : { height: `${Math.max(12, value)}%` }}
                        title={value === null ? "জমা নেই" : `${value}%`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1.5 border-t border-hairline pt-2">
                    <Link
                      href={`/dashboard/amalnama/grid?member=${member.id}&days=7`}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-primary-soft text-[11px] font-semibold text-primary-soft-foreground"
                    >
                      <LayoutGrid className="size-3.5" /> রিপোর্ট
                    </Link>
                    <Link
                      href={`/dashboard/amalnama/grid?member=${member.id}&days=7`}
                      className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-hairline-strong text-[11px] font-semibold text-foreground"
                    >
                      <MessageSquarePlus className="size-3.5" /> আমলনামা
                    </Link>
                    <Link
                      href={`/dashboard/ustad/reviews?member=${member.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-hairline-strong px-2 text-[11px] font-semibold text-foreground"
                    >
                      রিভিউ
                    </Link>
                  </div>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
