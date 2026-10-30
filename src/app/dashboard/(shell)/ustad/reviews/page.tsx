import { CycleStatus, Role } from "@prisma/client";
import { MessageCircleHeart } from "lucide-react";

import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { ReviewCard, ReviewComposer, type ReviewView } from "@/components/ustad/review-composer";
import { Card, CardContent } from "@/components/ui/card";
import { cycleStatusLabels } from "@/lib/constants";
import { requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "সাইকেল রিভিউ" };

const isId = (value: unknown): value is string => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export default async function UstadReviewsPage({ searchParams }: { searchParams: Promise<{ member?: string; cycle?: string }> }) {
  const session = await requireUstadhOrAdmin();
  const params = await searchParams;
  const isAdmin = session.user.role === Role.ADMIN;

  const [members, cycles, reviews] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true, role: Role.MEMBER, hideAmalnama: false }, orderBy: { name: "asc" }, select: { id: true, name: true, gender: true } }),
    prisma.cycle.findMany({ where: { status: { not: CycleStatus.DRAFT } }, orderBy: { startDate: "desc" }, select: { id: true, title: true, status: true } }),
    prisma.ustadhReview.findMany({
      // Admin sees every review; an Ustadh sees the ones they wrote.
      where: { member: { hideAmalnama: false }, ...(isAdmin ? {} : { reviewerId: session.user.id }) },
      orderBy: { updatedAt: "desc" },
      take: 60,
      include: { member: { select: { name: true } }, cycle: { select: { title: true } }, reviewer: { select: { name: true } } },
    }),
  ]);

  const views: ReviewView[] = reviews.map((review) => ({
    id: review.id,
    memberId: review.memberId,
    memberName: review.member.name,
    cycleId: review.cycleId,
    cycleTitle: review.cycle.title,
    reviewerName: review.reviewer.name,
    comment: review.comment,
    isVisibleToMember: review.isVisibleToMember,
    updatedAt: review.updatedAt.toISOString(),
    mine: review.reviewerId === session.user.id,
  }));
  const activeCycle = cycles.find((cycle) => cycle.status === CycleStatus.ACTIVE);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="উস্তাদ প্যানেল"
        title="সাইকেল রিভিউ"
        description="প্রতিটি সাইকেল শেষে বা চলাকালীন সদস্যকে তার আমলনামার ভিত্তিতে উৎসাহ ও নসীহত দিন। প্রতি সাইকেলে প্রতি সদস্যের জন্য আপনার একটি রিভিউ থাকে — আবার লিখলে আপডেট হবে।"
      />
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit lg:sticky lg:top-24">
          <CardContent>
            <h2 className="mb-4 font-bold text-foreground">রিভিউ লিখুন</h2>
            {cycles.length === 0 ? (
              <p className="text-sm text-muted-foreground">এখনও কোনো সাইকেল শুরু হয়নি।</p>
            ) : (
              <ReviewComposer
                key={`${params.member ?? ""}:${params.cycle ?? ""}`}
                members={members.map((member) => ({ id: member.id, label: `${member.name}${member.gender === "FEMALE" ? " (বোন)" : member.gender === "MALE" ? " (ভাই)" : ""}` }))}
                cycles={cycles.map((cycle) => ({ id: cycle.id, label: `${cycle.title} — ${cycleStatusLabels[cycle.status]}` }))}
                mine={views.filter((view) => view.mine)}
                initialMemberId={isId(params.member) ? params.member : undefined}
                initialCycleId={isId(params.cycle) ? params.cycle : activeCycle?.id}
              />
            )}
          </CardContent>
        </Card>
        <section className="space-y-3">
          <h2 className="px-1 font-bold text-foreground">{isAdmin ? "সব রিভিউ" : "আপনার লেখা রিভিউ"}</h2>
          {views.length === 0 ? (
            <EmptyState icon={MessageCircleHeart} title="এখনও কোনো রিভিউ নেই" description="বাম পাশের ফর্ম থেকে প্রথম রিভিউ লিখুন।" />
          ) : (
            views.map((review) => <ReviewCard key={review.id} review={review} canDelete={review.mine || isAdmin} />)
          )}
        </section>
      </div>
    </div>
  );
}
