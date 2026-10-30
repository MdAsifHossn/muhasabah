import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChatThread } from "@/components/chat/chat-thread";
import { getThreadMessages, markThreadRead } from "@/lib/messages";
import { isStaffRole, requireUser } from "@/lib/permissions";

export const metadata: Metadata = { title: "উস্তাদজির সাথে কথা" };

/** Member's private thread with the Ustadh team. Staff use the inbox instead. */
export default async function MemberMessagesPage() {
  const session = await requireUser();
  if (isStaffRole(session.user.role)) redirect("/dashboard/ustad/messages");
  const viewer = { id: session.user.id, role: session.user.role };
  await markThreadRead(viewer.id, viewer);
  const messages = await getThreadMessages(viewer.id, viewer);

  return (
    <ChatThread
      memberId={null}
      initialMessages={messages}
      title="উস্তাদজির সাথে কথা"
      subtitle="আপনার বার্তা শুধু উস্তাদজি ও অ্যাডমিন দেখতে পারেন"
      isStaffView={false}
    />
  );
}
