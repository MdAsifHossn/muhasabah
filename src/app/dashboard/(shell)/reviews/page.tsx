import { MessageCircleHeart } from "lucide-react";

import { CardSection } from "@/components/design/card-section";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function ReviewsPage() {
  const session = await requireUser();
  const reviews = await prisma.ustadhReview.findMany({
    where: { memberId: session.user.id, isVisibleToMember: true },
    orderBy: { updatedAt: "desc" },
    include: { cycle: { select: { title: true } }, reviewer: { select: { name: true } } },
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="মুহাসাবাহ"
        title="Admin Review"
        description="Admin আপনার জন্য যেসব review প্রকাশ করেছেন সেগুলো এখানে দেখা যাবে।"
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 shadow-xs">
            <MessageCircleHeart className="size-3.5 text-emerald-700" aria-hidden />
            {reviews.length}টি মতামত
          </span>
        }
      />

      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageCircleHeart}
          title="এখনো কোনো review দেওয়া হয়নি"
          description="সাইকেল চলাকালীন বা শেষে admin review প্রকাশ করতে পারবেন।"
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <CardSection
              key={review.id}
              title={review.cycle.title}
              action={
                <span className="text-xs font-medium text-stone-400">
                  {review.updatedAt.toLocaleDateString("bn-BD")}
                </span>
              }
            >
              <div className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-sunken text-emerald-700">
                  <MessageCircleHeart className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-[15px] leading-7 text-stone-700">{review.comment}</p>
                  <p className="mt-3 text-xs text-stone-400">— {review.reviewer.name}</p>
                </div>
              </div>
            </CardSection>
          ))}
        </div>
      )}
    </div>
  );
}
