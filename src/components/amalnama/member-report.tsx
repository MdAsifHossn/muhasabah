import type { Role } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { bn } from "date-fns/locale";
import { EyeOff, LayoutGrid, MessageSquareText } from "lucide-react";
import Link from "next/link";

import { CommentDeleteButton, CommentForm } from "@/components/amalnama/comment-form";
import { toBn, type ReportSummary } from "@/components/amalnama/report-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { genderLabels } from "@/lib/amal-audience";
import { roleLabels } from "@/lib/constants";
import { formatBanglaDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type MemberComment = {
  id: string;
  comment: string;
  createdAt: Date;
  authorId: string;
  author: { name: string; role: Role };
};

const weekdayBn: Record<string, string> = {
  SUNDAY: "রবিবার",
  MONDAY: "সোমবার",
  TUESDAY: "মঙ্গলবার",
  WEDNESDAY: "বুধবার",
  THURSDAY: "বৃহস্পতিবার",
  FRIDAY: "শুক্রবার",
  SATURDAY: "শনিবার",
};

function Avatar({ name, female }: { name: string; female?: boolean }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold", female ? "bg-female-soft text-female" : "bg-primary-soft text-primary")}>
      {name.trim().slice(0, 1)}
    </span>
  );
}

/** Privacy placeholder: the roster stays complete but no data is shown. */
export function HiddenAmalnamaCard({ name, role }: { name: string; role: Role }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground">{roleLabels[role]}</p>
        </div>
        <Badge variant="secondary">
          <EyeOff className="size-3.5" /> আমলনামা গোপন
        </Badge>
      </CardContent>
      <p className="border-t border-hairline px-4 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
        সদস্যটি প্রোফাইল থেকে আমলনামা গোপন রেখেছেন — উস্তাদজি ও অ্যাডমিন কোনো তথ্য দেখতে পারবেন না।
      </p>
    </Card>
  );
}

function percentTone(percent: number | null) {
  if (percent === null) return "secondary" as const;
  if (percent >= 80) return "soft" as const;
  if (percent >= 40) return "warning" as const;
  return "danger" as const;
}

export function MemberReport({
  member,
  report,
  comments,
  windowLabel,
  canComment,
  viewerId,
  viewerIsAdmin,
  gridHref,
  maxDays = 30,
}: {
  member: { id: string; name: string; role: Role; gender: string };
  report: ReportSummary;
  comments: MemberComment[];
  windowLabel: string;
  canComment: boolean;
  viewerId: string;
  viewerIsAdmin: boolean;
  gridHref: string | null;
  maxDays?: number;
}) {
  const female = member.gender === "FEMALE";
  const days = [...report.days].reverse().slice(0, maxDays);
  const olderDays = report.days.length - days.length;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-4 py-3.5 sm:px-6">
        <Avatar name={member.name} female={female} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-foreground">{member.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {genderLabels[member.gender as keyof typeof genderLabels] ?? ""} • {roleLabels[member.role]} • {windowLabel}
          </p>
        </div>
        <Badge variant={percentTone(report.enteredDays ? report.percent : null)} className="text-sm">
          {toBn(report.percent)}%
        </Badge>
      </div>

      <CardContent className="space-y-5">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: "এন্ট্রি", value: `${toBn(report.enteredDays)}/${toBn(report.totalDays)}` },
            { label: "টানা", value: `${toBn(report.streak)} দিন` },
            { label: "মিস আমল", value: toBn(report.missed) },
            { label: "পয়েন্ট", value: `${toBn(report.score)}` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface-sunken px-1 py-2.5">
              <p className="text-[10px] font-semibold text-muted-foreground">{stat.label}</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground">দিনভিত্তিক হিসাব</h3>
            {gridHref ? (
              <Link href={gridHref} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <LayoutGrid className="size-3.5" /> গ্রিড ভিউ
              </Link>
            ) : null}
          </div>
          <ul className="mt-2 space-y-2">
            {days.map((day) => {
              if (!day.entry) {
                return (
                  <li key={day.key} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-hairline-strong px-3 py-2.5">
                    <p className="text-xs font-semibold text-foreground">
                      {formatBanglaDate(day.date)} <span className="font-normal text-muted-foreground">• {weekdayBn[day.weekday]}</span>
                    </p>
                    <Badge variant="secondary">এন্ট্রি নেই</Badge>
                  </li>
                );
              }
              const missed = day.items.filter((item) => day.outcomes.get(item.id)?.outcome === "missed").map((item) => item.titleBn);
              const partial = day.items.filter((item) => day.outcomes.get(item.id)?.outcome === "partial").map((item) => item.titleBn);
              return (
                <li key={day.key} className="rounded-xl border border-hairline px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 text-xs font-semibold text-foreground">
                      {formatBanglaDate(day.date)} <span className="font-normal text-muted-foreground">• {weekdayBn[day.weekday]}</span>
                    </p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {day.isPeriodDay ? <Badge variant="female">মাসিক</Badge> : null}
                      {day.entry.status === "DRAFT" ? <Badge variant="secondary">খসড়া</Badge> : null}
                      <Badge variant={percentTone(day.percent)}>{toBn(day.percent ?? 0)}%</Badge>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${day.percent ?? 0}%` }} />
                  </div>
                  {missed.length > 0 ? (
                    <p className="mt-1.5 text-[11px] leading-5 text-danger">
                      <span className="font-bold">মিস ({toBn(missed.length)}):</span> {missed.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-[11px] font-semibold text-success">কোনো আমল মিস হয়নি।</p>
                  )}
                  {partial.length > 0 ? (
                    <p className="mt-0.5 text-[11px] leading-5 text-warning">
                      <span className="font-bold">আংশিক:</span> {partial.join(", ")}
                    </p>
                  ) : null}
                  {day.entry.personalNote ? <p className="mt-1 text-[11px] italic leading-5 text-muted-foreground">নোট: {day.entry.personalNote}</p> : null}
                </li>
              );
            })}
          </ul>
          {olderDays > 0 ? <p className="mt-2 text-center text-[11px] text-muted-foreground">আরও {toBn(olderDays)} দিন — পুরোটা দেখতে গ্রিড ভিউ খুলুন।</p> : null}
        </div>

        <div className="border-t border-hairline pt-4">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MessageSquareText className="size-4 text-primary" /> উস্তাদের মন্তব্য ({toBn(comments.length)})
          </h3>
          <div className="mt-2 space-y-2">
            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground">এখনো কোনো মন্তব্য নেই।</p>
            ) : (
              comments.map((item) => (
                <div key={item.id} className="rounded-xl bg-gold-soft px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{item.comment}</p>
                    {item.authorId === viewerId || viewerIsAdmin ? <CommentDeleteButton commentId={item.id} /> : null}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    <span className="font-bold text-gold-foreground">{item.author.name}</span> ({roleLabels[item.author.role]}) •{" "}
                    {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: bn })}
                  </p>
                </div>
              ))
            )}
          </div>
          {canComment ? (
            <div className="mt-3">
              <CommentForm memberId={member.id} memberName={member.name} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
