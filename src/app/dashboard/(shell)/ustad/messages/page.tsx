import type { Metadata } from "next";

import { InboxList } from "@/components/chat/inbox-list";
import { PageHeader } from "@/components/design/page-header";
import { Badge } from "@/components/ui/badge";
import { getInboxThreads } from "@/lib/messages";
import { requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "সদস্যদের বার্তা" };

export default async function UstadInboxPage() {
  await requireUstadhOrAdmin();
  const [threads, members] = await Promise.all([
    getInboxThreads(),
    prisma.user.findMany({ where: { isActive: true, role: "MEMBER" }, orderBy: { name: "asc" }, select: { id: true, name: true, gender: true } }),
  ]);
  const unread = threads.reduce((sum, thread) => sum + thread.unread, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        eyebrow="উস্তাদ প্যানেল"
        title="সদস্যদের বার্তা"
        description="সদস্যদের প্রশ্ন ও কথোপকথন — উত্তর দিন, প্রয়োজনে নিজে কথা শুরু করুন।"
        meta={unread ? <Badge>{unread.toLocaleString("bn-BD")}টি নতুন বার্তা</Badge> : <Badge variant="secondary">সব পড়া হয়েছে</Badge>}
      />
      <InboxList threads={threads} members={members} />
    </div>
  );
}
