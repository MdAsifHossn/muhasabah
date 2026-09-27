import { MessageCircleHeart } from "lucide-react";

import { EmptyState, PageHeader } from "@/components/dashboard/common";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function ReviewsPage() {
  const session=await requireUser();
  const reviews=await prisma.ustadhReview.findMany({where:{memberId:session.user.id,isVisibleToMember:true},orderBy:{updatedAt:"desc"},include:{cycle:{select:{title:true}},reviewer:{select:{name:true}}}});
  return <div className="mx-auto max-w-4xl space-y-7"><PageHeader title="Admin Review" description="Admin আপনার জন্য যেসব review প্রকাশ করেছেন সেগুলো এখানে দেখা যাবে।"/>{reviews.length===0?<EmptyState title="এখনো কোনো review দেওয়া হয়নি" description="সাইকেল চলাকালীন বা শেষে admin review প্রকাশ করতে পারবেন।"/>:<div className="space-y-4">{reviews.map((review)=><Card key={review.id}><CardContent><div className="flex items-start gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><MessageCircleHeart className="size-5"/></div><div><p className="text-xs font-semibold text-emerald-700">{review.cycle.title}</p><p className="mt-2 whitespace-pre-wrap leading-7 text-stone-700">{review.comment}</p><p className="mt-4 text-xs text-stone-400">{review.reviewer.name} • {review.updatedAt.toLocaleDateString("bn-BD")}</p></div></div></CardContent></Card>)}</div>}</div>;
}