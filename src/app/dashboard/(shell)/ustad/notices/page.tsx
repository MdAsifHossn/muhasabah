import { Role } from "@prisma/client";
import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { NoticeCard, NoticeComposer, type NoticeView } from "@/components/ustad/notice-manager";
import { Card, CardContent } from "@/components/ui/card";
import { requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "নোটিশ প্রকাশ" };

export default async function UstadNoticesPage() {
  const session = await requireUstadhOrAdmin();
  const isAdmin = session.user.role === Role.ADMIN;
  const notices = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: { author: { select: { name: true } } },
  });

  const views: NoticeView[] = notices.map((notice) => ({
    id: notice.id,
    title: notice.title,
    body: notice.body,
    audience: notice.audience,
    pinned: notice.pinned,
    authorName: notice.author.name,
    createdAt: notice.createdAt.toISOString(),
    canManage: isAdmin || notice.authorId === session.user.id,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="উস্তাদ প্যানেল"
        title="নোটিশ বোর্ড"
        description="সবার জন্য, শুধু ভাইদের বা শুধু বোনদের জন্য নোটিশ দিন। সদস্যরা হোম পেজ ও নোটিশ বোর্ডে দেখতে পাবেন।"
      />
      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit lg:sticky lg:top-24">
          <CardContent>
            <h2 className="mb-4 font-bold text-foreground">নতুন নোটিশ</h2>
            <NoticeComposer />
          </CardContent>
        </Card>
        <section className="space-y-3">
          <h2 className="px-1 font-bold text-foreground">প্রকাশিত নোটিশ</h2>
          {views.length === 0 ? (
            <EmptyState icon={Megaphone} title="এখনও কোনো নোটিশ নেই" description="প্রথম নোটিশটি লিখে সদস্যদের জানিয়ে দিন।" />
          ) : (
            views.map((notice) => <NoticeCard key={notice.id} notice={notice} />)
          )}
        </section>
      </div>
    </div>
  );
}
