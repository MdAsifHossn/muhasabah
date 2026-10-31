import { MessageCircleHeart } from "lucide-react";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/constants";
import { formatBanglaDate } from "@/lib/dates";
import { isStaffRole, requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "উস্তাদের রিভিউ" };

export default async function ReviewsPage() {
  const session = await requireUser();
  if (isStaffRole(session.user.role)) redirect("/dashboard/ustad/reviews");
  const reviews = await prisma.ustadhReview.findMany({
    where: { memberId: session.user.id, isVisibleToMember: true },
    orderBy: { updatedAt: "desc" },
    include: { cycle: { select: { title: true } }, reviewer: { select: { name: true, role: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="যোগাযোগ" title="উস্তাদের রিভিউ" description="প্রতিটি সাইকেলে উস্তাদজি আপনার আমলনামা দেখে যে পরামর্শ দিয়েছেন।" />
      {reviews.length === 0 ? (
        <EmptyState icon={MessageCircleHeart} title="এখনো কোনো রিভিউ নেই" description="সাইকেল চলাকালীন বা শেষে উস্তাদজি রিভিউ প্রকাশ করলে এখানে দেখা যাবে।" />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-soft-foreground">{review.cycle.title}</span>
                  <span className="text-xs text-muted-foreground">{formatBanglaDate(review.updatedAt)}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap font-bangla-serif text-[16px] leading-8 text-foreground">{review.comment}</p>
                <div className="mt-4 flex items-center gap-2.5 border-t border-hairline pt-3">
                  <span className="grid size-8 place-items-center rounded-full bg-gold-soft text-sm font-bold text-gold-foreground">{review.reviewer.name.slice(0, 1)}</span>
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">{review.reviewer.name}</p>
                    <p className="text-muted-foreground">{roleLabels[review.reviewer.role]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
