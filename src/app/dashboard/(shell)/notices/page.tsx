import { Megaphone } from "lucide-react";
import { redirect } from "next/navigation";

import { NoticeCard } from "@/components/amalnama/notice-card";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { getNoticesFor } from "@/lib/notices";
import { isStaffRole, requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "নোটিশ বোর্ড" };

export default async function NoticesPage() {
  const session = await requireUser();
  if (isStaffRole(session.user.role)) redirect("/dashboard/ustad/notices");
  const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gender: true } });
  const notices = await getNoticesFor({ role: session.user.role, gender: viewer?.gender }, 60);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        eyebrow="যোগাযোগ"
        title="নোটিশ বোর্ড"
        description="উস্তাদজির ঘোষণা, দিকনির্দেশনা ও খবর।"
        actions={null}
      />
      {notices.length === 0 ? (
        <EmptyState icon={Megaphone} title="এখনো কোনো নোটিশ নেই" description="নতুন ঘোষণা এলে এখানে দেখা যাবে।" />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  );
}
