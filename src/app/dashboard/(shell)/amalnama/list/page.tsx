import { Gender, type Prisma } from "@prisma/client";
import { subDays } from "date-fns";
import { MessageSquareText, Search, Target, Users } from "lucide-react";
import Link from "next/link";

import { getAmalCommentClient } from "@/components/amalnama/comment-db";
import { HiddenAmalnamaCard, MemberReport, type MemberComment } from "@/components/amalnama/member-report";
import { RANGE_OPTIONS, RangeFilter, parseRange } from "@/components/amalnama/range-filter";
import { buildReport, laterOf, reportEntrySelect, reportItemSelect, toBn } from "@/components/amalnama/report-data";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { StatTile } from "@/components/design/stat-tile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { isAdminRole, isStaffRole, requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "আমলনামা তালিকা" };

type CommentRow = Prisma.AmalCommentGetPayload<{
  select: { id: true; memberId: true; authorId: true; comment: true; createdAt: true; author: { select: { name: true; role: true } } };
}>;

const GENDER_FILTERS = [
  { key: "", label: "সবাই" },
  { key: "MALE", label: "ভাইয়েরা" },
  { key: "FEMALE", label: "বোনেরা" },
] as const;

export default async function AmalnamaListPage({ searchParams }: { searchParams: Promise<{ range?: string; q?: string; gender?: string; member?: string }> }) {
  const session = await requireUser();
  const isSupervisor = isStaffRole(session.user.role);
  const params = await searchParams;
  const range = parseRange(params.range);
  const option = RANGE_OPTIONS.find((candidate) => candidate.key === range) ?? RANGE_OPTIONS[0];
  const query = isSupervisor ? (params.q ?? "").trim().slice(0, 60) : "";
  const genderFilter = isSupervisor && (params.gender === Gender.MALE || params.gender === Gender.FEMALE) ? params.gender : null;

  // ?member=<id> (from the Ustad board / grid) focuses one member; members always see themselves.
  const focusId = isSupervisor && typeof params.member === "string" && /^[a-f\d]{24}$/i.test(params.member) ? params.member : null;

  const today = startOfBangladeshDay(getBangladeshToday());
  const start = startOfBangladeshDay(subDays(today, option.days - 1));
  const windowLabel = `${formatBanglaDate(start)} – ${formatBanglaDate(today)}`;

  // Members see only themselves; staff see every active account (filtered).
  const members = await prisma.user.findMany({
    where: focusId
      ? { id: focusId }
      : isSupervisor
      ? { isActive: true, ...(genderFilter ? { gender: genderFilter } : {}), ...(query ? { name: { contains: query, mode: "insensitive" } } : {}) }
      : { id: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true, gender: true, hideAmalnama: true, joinedAt: true },
  });
  // Privacy: hidden members contribute zero data to a supervisor (the viewer always sees themself).
  const visibleIds = members.filter((member) => member.id === session.user.id || !member.hideAmalnama).map((member) => member.id);

  const [items, entries] = await Promise.all([
    prisma.amalItem.findMany({ orderBy: { order: "asc" }, select: reportItemSelect }),
    prisma.dailyAmalEntry.findMany({ where: { userId: { in: visibleIds }, date: { gte: start, lte: today } }, orderBy: { date: "asc" }, select: { ...reportEntrySelect, userId: true } }),
  ]);

  let commentRows: CommentRow[] = [];
  let commentsAvailable = true;
  try {
    commentRows = await getAmalCommentClient().amalComment.findMany({
      where: { memberId: { in: visibleIds } },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: { id: true, memberId: true, authorId: true, comment: true, createdAt: true, author: { select: { name: true, role: true } } },
    });
  } catch {
    commentsAvailable = false;
  }

  const entriesByUser = new Map<string, typeof entries>();
  for (const entry of entries) entriesByUser.set(entry.userId, [...(entriesByUser.get(entry.userId) ?? []), entry]);
  const commentsByUser = new Map<string, MemberComment[]>();
  for (const row of commentRows) commentsByUser.set(row.memberId, [...(commentsByUser.get(row.memberId) ?? []), row].slice(0, 10));

  const reports = new Map(
    members
      .filter((member) => visibleIds.includes(member.id))
      .map((member) => [
        member.id,
        buildReport({ items, entries: entriesByUser.get(member.id) ?? [], gender: member.gender, start: laterOf(start, startOfBangladeshDay(member.joinedAt)), end: today }),
      ]),
  );
  const reportList = [...reports.values()];
  const average = reportList.length ? Math.round(reportList.reduce((sum, report) => sum + report.percent, 0) / reportList.length) : 0;
  const todayEntered = reportList.filter((report) => report.days.at(-1)?.entry).length;
  const linkParams = { q: query || undefined, gender: genderFilter ?? undefined, member: focusId ?? undefined };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={`রিপোর্ট • ${option.label}`}
        title={isSupervisor ? "সদস্যদের আমলনামা" : "আমার আমলনামা তালিকা"}
        description={
          isSupervisor
            ? "প্রত্যেক সদস্যের দিনভিত্তিক আমল, মিস হওয়া আমল ও আপনার মন্তব্য — এক জায়গায়।"
            : "আপনার দিনভিত্তিক আমলনামা ও উস্তাদের মন্তব্য।"
        }
      />

      {isSupervisor ? (
        <form className="flex gap-2" action="/dashboard/amalnama/list">
          <input type="hidden" name="range" value={range} />
          {genderFilter ? <input type="hidden" name="gender" value={genderFilter} /> : null}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
            <Input name="q" defaultValue={query} placeholder="সদস্যের নাম খুঁজুন…" className="pl-9" />
          </div>
          <Button type="submit" variant="outline">
            খুঁজুন
          </Button>
        </form>
      ) : null}

      <div className="space-y-2">
        <RangeFilter active={range} params={linkParams} />
        {isSupervisor ? (
          <div className="flex gap-2">
            {GENDER_FILTERS.map((filter) => {
              const search = new URLSearchParams({ range, ...(query ? { q: query } : {}), ...(filter.key ? { gender: filter.key } : {}) });
              const active = (genderFilter ?? "") === filter.key;
              return (
                <Link
                  key={filter.key || "all"}
                  href={`/dashboard/amalnama/list?${search.toString()}`}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                    active ? (filter.key === "FEMALE" ? "bg-female text-white" : "bg-foreground text-background") : "bg-surface-sunken text-muted-foreground",
                  )}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      {isSupervisor ? (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="সদস্য" value={toBn(members.length)} icon={Users} />
          <StatTile label="আজ এন্ট্রি" value={`${toBn(todayEntered)}/${toBn(reportList.length)}`} icon={Target} tone="gold" />
          <StatTile label="গড় সম্পন্নতা" value={`${toBn(average)}%`} icon={MessageSquareText} tone="info" />
        </div>
      ) : null}

      {!commentsAvailable ? (
        <p className="rounded-2xl bg-warning-soft px-4 py-3 text-xs font-semibold text-warning">মন্তব্য এই মুহূর্তে লোড করা যায়নি — বাকি রিপোর্ট দেখা যাচ্ছে।</p>
      ) : null}

      {focusId ? (
        <Link href={`/dashboard/amalnama/list?range=${range}`} className="inline-flex text-sm font-semibold text-primary">
          ← সব সদস্য দেখুন
        </Link>
      ) : null}

      {members.length === 0 ? (
        <EmptyState icon={Users} title="কোনো সদস্য পাওয়া যায়নি" description={query ? "অন্য নাম দিয়ে খুঁজে দেখুন।" : "সদস্য যোগ হলে এখানে তাদের আমলনামা দেখা যাবে।"} />
      ) : (
        <div className="space-y-5">
          {members.map((member) => {
            const report = reports.get(member.id);
            if (!report) return <HiddenAmalnamaCard key={member.id} name={member.name} role={member.role} />;
            const isSelf = member.id === session.user.id;
            return (
              <MemberReport
                key={member.id}
                member={member}
                report={report}
                comments={commentsByUser.get(member.id) ?? []}
                windowLabel={windowLabel}
                canComment={isSupervisor && commentsAvailable && !isSelf}
                viewerId={session.user.id}
                viewerIsAdmin={isAdminRole(session.user.role)}
                gridHref={isSelf ? "/dashboard/amalnama/grid" : `/dashboard/amalnama/grid?member=${member.id}`}
                maxDays={isSupervisor ? 7 : 40}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
