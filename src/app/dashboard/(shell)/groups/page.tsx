import { Users } from "lucide-react";
import type { Metadata } from "next";

import { ChatThread } from "@/components/chat/chat-thread";
import { GroupInfoButton } from "@/components/chat/group-info-sheet";
import { GroupList } from "@/components/chat/group-list";
import { Badge } from "@/components/ui/badge";
import { canManageGroups, getGroupDetail, getGroupMessages, listGroups, markGroupRead } from "@/lib/chat-groups";
import { requireUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "গ্রুপ চ্যাট" };

/** Group chats: list on the left (desktop) / full screen (phone), the open group beside it. */
export default async function GroupsPage({ searchParams }: { searchParams: Promise<{ group?: string }> }) {
  const session = await requireUser();
  const params = await searchParams;
  const selectedId = params.group && /^[a-f\d]{24}$/i.test(params.group) ? params.group : null;
  const [groups, detail, canCreate] = await Promise.all([listGroups(session.user.id), selectedId ? getGroupDetail(selectedId, session.user.id) : null, canManageGroups(session.user.id)]);
  const messages = detail ? await (async () => { await markGroupRead(detail.id, session.user.id); return getGroupMessages(detail.id, session.user.id); })() : null;
  const unread = groups.reduce((sum, group) => sum + (group.id === detail?.id ? 0 : group.unread), 0);

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl space-y-4 lg:space-y-5 lg:[--chat-h:calc(100dvh-64px-5rem-3.5rem)]">
      <div className={detail ? "hidden items-center justify-between gap-3 lg:flex" : "flex items-center justify-between gap-3"}>
        <h1 className="text-xl font-bold lg:text-2xl">গ্রুপ চ্যাট</h1>
        {unread ? <Badge>{unread.toLocaleString("bn-BD")}টি নতুন</Badge> : <Badge variant="secondary">{groups.length.toLocaleString("bn-BD")}টি গ্রুপ</Badge>}
      </div>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-stretch">
        <div className={detail ? "hidden min-w-0 lg:block" : "block min-w-0"}>
          <div className="no-scrollbar lg:max-h-[var(--chat-h)] lg:overflow-y-auto lg:rounded-card">
            <GroupList groups={groups} selectedId={detail?.id} canCreate={canCreate} />
          </div>
        </div>
        {detail && messages ? (
          <ChatThread
            key={detail.id}
            mode="group"
            groupId={detail.id}
            memberId={null}
            initialMessages={messages}
            title={detail.name}
            subtitle={`${detail.members.length.toLocaleString("bn-BD")} জন সদস্য`}
            backHref="/dashboard/groups"
            isStaffView={false}
            canModerate={detail.isAdmin}
            headerAction={<GroupInfoButton group={detail} currentUserId={session.user.id} canAdd={canCreate} />}
          />
        ) : (
          <div className="hidden min-h-[520px] items-center justify-center rounded-card border bg-card px-6 text-center lg:flex">
            <div className="max-w-sm">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-soft text-primary"><Users className="size-7" /></span>
              <p className="mt-3 text-base font-semibold text-foreground">একটি গ্রুপ বেছে নিন</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">বাঁ পাশের তালিকা থেকে গ্রুপ খুলুন, অথবা নতুন গ্রুপ তৈরি করে সদস্যদের যোগ করুন।</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
