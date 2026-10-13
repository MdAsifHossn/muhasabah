import type { Prisma } from "@prisma/client";
import { Gender, Role } from "@prisma/client";
import { subDays, subMonths, subYears } from "date-fns";
import { Award, ClipboardList, MessageSquareText, Target, Users } from "lucide-react";

import { getAmalCommentClient } from "@/components/amalnama/comment-db";
import { MemberReport, type MemberComment } from "@/components/amalnama/member-report";
import { RangeFilter, RANGE_OPTIONS, parseRange } from "@/components/amalnama/range-filter";
import { EmptyState, PageHeader, StatCard } from "@/components/dashboard/common";
import { isVisibleItem } from "@/lib/amal-audience";
import { formatBanglaDate, getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type CommentRow = Prisma.AmalCommentGetPayload<{
  select: { id: true; memberId: true; comment: true; createdAt: true; author: { select: { name: true; role: true } } };
}>;

/** Turns `?range=` into the start of the window (null = সব সময়) plus "today" in Bangladesh time. */
function resolveRange(range: ReturnType<typeof parseRange>) {
  const today = getBangladeshToday();
  if (range === "all") return { start: null as Date | null, today };
  const start = startOfBangladeshDay(
    range === "7d" ? subDays(today, 6) : range === "40d" ? subDays(today, 39) : range === "1m" ? subMonths(today, 1) : subYears(today, 1),
  );
  return { start, today };
}

export default async function AmalnamaListPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  const session = await requireUser();
  const role = session.user.role as Role;
  const isSupervisor = role === Role.ADMIN || role === Role.USTADH;

  const range = parseRange((await searchParams).range);
  const { start, today } = resolveRange(range);
  const rangeLabel = RANGE_OPTIONS.find((option) => option.key === range)?.label ?? "৭ দিন";
  const windowLabel = start ? `${formatBanglaDate(start)} – ${formatBanglaDate(today)}` : "সব সময়";

  // ── Visibility: supervisors see every active member, a member only themself.
  // Members who hid their Amalnama contribute ZERO data here: their entries and
  // comments are excluded from the queries themselves (the roster stays complete).
  const dateFilter = start ? { gte: start } : undefined;
  const entryWhere: Prisma.DailyAmalEntryWhereInput = { date: dateFilter, ...(isSupervisor ? { user: { hideAmalnama: false } } : { userId: session.user.id }) };
  const commentWhere: Prisma.AmalCommentWhereInput = { createdAt: dateFilter, ...(isSupervisor ? { member: { hideAmalnama: false } } : { memberId: session.user.id }) };

  const [members, entries, amalItems] = await Promise.all([
    prisma.user.findMany({
      where: isSupervisor ? { isActive: true } : { id: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true, gender: true, hideAmalnama: true, joinedAt: true },
    }),
    prisma.dailyAmalEntry.findMany({ where: entryWhere, orderBy: [{ date: "desc" }, { createdAt: "asc" }] }),
    prisma.amalItem.findMany({ select: { id: true, titleBn: true, genderScope: true } }),
  ]);

  // Comments are read through the comment client; if that still fails the report
  // must render instead of crashing, so degrade to "no comments" with a notice.
  let commentRows: CommentRow[] = [];
  let commentsAvailable = true;
  try {
    commentRows = await getAmalCommentClient().amalComment.findMany({
      where: commentWhere,
      orderBy: { createdAt: "desc" },
      select: { id: true, memberId: true, comment: true, createdAt: true, author: { select: { name: true, role: true } } },
    });
  } catch {
    commentsAvailable = false;
  }

  const entriesByUser = new Map<string, typeof entries>();
  for (const entry of entries) {
    const bucket = entriesByUser.get(entry.userId) ?? [];
    bucket.push(entry);
    entriesByUser.set(entry.userId, bucket);
  }
  const commentsByUser = new Map<string, MemberComment[]>();
  for (const item of commentRows) {
    const bucket = commentsByUser.get(item.memberId) ?? [];
    bucket.push({ id: item.id, comment: item.comment, createdAt: item.createdAt, author: item.author });
    commentsByUser.set(item.memberId, bucket);
  }
  // Titles usable for a given member: only items inside that member's audience,
  // so a MALE-only amal never shows up (as a name or a "missed") on a women's report.
  const visibleTitlesFor = (gender: Gender) =>
    new Map(amalItems.filter((item) => isVisibleItem(item, gender)).map((item) => [item.id, item.titleBn]));
  const totalScore = entries.reduce((sum, entry) => sum + entry.totalScore, 0);
  const totalMax = entries.reduce((sum, entry) => sum + entry.maxPossibleScore, 0);
  const averagePercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow={`রিপোর্ট • ${rangeLabel}`}
        title="আমলনামা তালিকা"
        description={
          isSupervisor
            ? "সদস্যদের দিনভিত্তিক আমলনামা — কোন দিনে কোন আমল বাদ পড়েছে তা দেখুন এবং প্রয়োজনে মন্তব্য রাখুন।"
            : "আপনার দিনভিত্তিক আমলনামা — কোন দিনে কোন আমল বাদ পড়েছে তা এখানে দেখা যাবে।"
        }
        action={
          isSupervisor
            ? { label: "আমল আইটেম ব্যবস্থাপনা", href: "/dashboard/amal-items" }
            : { label: "আজকের আমলনামা", href: "/dashboard/amalnama" }
        }
      />

      {/* ── Range chips (plain links, server rendered) ─────────── */}
      <RangeFilter active={range} />

      {/* ── Summary stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={isSupervisor ? "সদস্য" : "প্রোফাইল"} value={members.length} note={windowLabel} icon={Users} />
        <StatCard label="মোট এন্ট্রি" value={entries.length} note={rangeLabel} icon={ClipboardList} />
        <StatCard label="গড় সম্পন্ন" value={`${averagePercent}%`} note="সব এন্ট্রি মিলিয়ে" icon={Target} />
        <StatCard label="মোট পয়েন্ট" value={`${totalScore}/${totalMax}`} note="প্রাপ্ত/সর্বোচ্চ" icon={Award} />
      </div>

      {!commentsAvailable ? (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
          <MessageSquareText className="mt-0.5 size-4 shrink-0" />
          উস্তাদের মন্তব্য এই মুহূর্তে পড়া সম্ভব হয়নি — বাকি রিপোর্ট স্বাভাবিকভাবে দেখা যাচ্ছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।
        </div>
      ) : null}

      {/* ── Per member report ──────────────────────────────────── */}
      {members.length === 0 ? (
        <EmptyState title="কোনো সদস্য পাওয়া যায়নি" description="সদস্য যোগ হলে এখানে তাদের আমলনামার রিপোর্ট দেখা যাবে।" />
      ) : (
        <div className="space-y-5">
          {members.map((member) => {
            // A hidden Amalnama renders as a name+role placeholder: no stats, no rows,
            // no missed amals, no scores, no comments.
            const hidden = isSupervisor && member.hideAmalnama;
            // Grid entry point: self → plain URL, supervisor → any member via ?member=.
            const gridHref = hidden
              ? null
              : member.id === session.user.id
                ? "/dashboard/amalnama/grid"
                : isSupervisor
                  ? `/dashboard/amalnama/grid?member=${member.id}`
                  : null;
            return (
              <MemberReport
                key={member.id}
                member={member}
                entries={hidden ? [] : (entriesByUser.get(member.id) ?? [])}
                comments={hidden ? [] : (commentsByUser.get(member.id) ?? [])}
                itemTitles={hidden ? new Map<string, string>() : visibleTitlesFor(member.gender)}
                windowStart={start}
                windowLabel={windowLabel}
                today={today}
                canComment={isSupervisor && commentsAvailable && !hidden}
                gridHref={gridHref}
                hiddenAmalnama={hidden}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
