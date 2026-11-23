import type { Metadata } from "next";

import { ChatThread } from "@/components/chat/chat-thread";
import { InboxList } from "@/components/chat/inbox-list";
import { Badge } from "@/components/ui/badge";
import { genderLabels } from "@/lib/amal-audience";
import {
  getInboxThreads,
  getThreadMessages,
  markThreadRead,
} from "@/lib/messages";
import { requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "সদস্যদের বার্তা" };

export default async function UstadInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const session = await requireUstadhOrAdmin();
  const params = await searchParams;
  const selectedId =
    params.member && /^[a-f\d]{24}$/i.test(params.member)
      ? params.member
      : null;
  const [threads, members] = await Promise.all([
    getInboxThreads(),
    prisma.user.findMany({
      where: { isActive: true, role: "MEMBER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, gender: true },
    }),
  ]);
  const unread = threads.reduce((sum, thread) => sum + thread.unread, 0);
  const selectedMember = selectedId
    ? await prisma.user.findUnique({
        where: { id: selectedId },
        select: { id: true, name: true, gender: true, isActive: true },
      })
    : null;
  const selectedMessages = selectedMember
    ? await (async () => {
        const viewer = { id: session.user.id, role: session.user.role };
        await markThreadRead(selectedMember.id, viewer);
        return getThreadMessages(selectedMember.id, viewer);
      })()
    : null;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-4 lg:space-y-5 lg:[--chat-h:calc(100dvh-64px-5rem-3.5rem)]">
      {/* One slim row (instead of a 3-line header). On phones it hides while a thread is open. */}
      <div className={selectedMember ? "hidden items-center justify-between gap-3 lg:flex" : "flex items-center justify-between gap-3"}>
        <h1 className="text-xl font-bold lg:text-2xl">সদস্যদের বার্তা</h1>
        {unread ? <Badge>{unread.toLocaleString("bn-BD")}টি নতুন</Badge> : <Badge variant="secondary">সব পড়া হয়েছে</Badge>}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-stretch">
        <div className={selectedMember ? "hidden min-w-0 lg:block" : "block min-w-0"}>
          <div className="no-scrollbar lg:max-h-[var(--chat-h)] lg:overflow-y-auto lg:rounded-card">
          <InboxList
            threads={threads}
            members={members}
            selectedMemberId={selectedMember?.id}
            compact
          />
          </div>
        </div>
        {selectedMember && selectedMessages ? (
          <ChatThread
            memberId={selectedMember.id}
            initialMessages={selectedMessages}
            title={selectedMember.name}
            subtitle={`${genderLabels[selectedMember.gender]} • সদস্য`}
            backHref="/dashboard/ustad/messages"
            isStaffView
            canModerate={session.user.role === "USTADH"}
            canPost={selectedMember.isActive}
            disabledReason="এই সদস্যের অ্যাকাউন্ট নিষ্ক্রিয় — নতুন বার্তা পাঠানো যাবে না।"
          />
        ) : (
          <div className="hidden min-h-[520px] items-center justify-center rounded-card border bg-card px-6 text-center lg:flex">
            <div className="max-w-sm">
              <p className="text-base font-semibold text-foreground">
                একজন সদস্য নির্বাচন করুন
              </p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                বাম পাশের তালিকা থেকে সদস্য বেছে নিলে এখানেই তাঁর সঙ্গে কথোপকথন
                দেখা ও উত্তর দেওয়া যাবে।
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
