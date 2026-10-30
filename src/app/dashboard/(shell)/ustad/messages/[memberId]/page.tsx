import { Role } from "@prisma/client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatThread } from "@/components/chat/chat-thread";
import { genderLabels } from "@/lib/amal-audience";
import { getThreadMessages, markThreadRead } from "@/lib/messages";
import { requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "কথোপকথন" };

export default async function UstadThreadPage({ params }: { params: Promise<{ memberId: string }> }) {
  const session = await requireUstadhOrAdmin();
  const { memberId } = await params;
  if (!/^[a-f\d]{24}$/i.test(memberId)) notFound();
  const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true, name: true, gender: true, isActive: true } });
  if (!member) notFound();

  const viewer = { id: session.user.id, role: session.user.role };
  await markThreadRead(member.id, viewer);
  const messages = await getThreadMessages(member.id, viewer);

  return (
    <ChatThread
      memberId={member.id}
      initialMessages={messages}
      title={member.name}
      subtitle={`${genderLabels[member.gender]} • সদস্য`}
      backHref="/dashboard/ustad/messages"
      isStaffView
      canModerate={session.user.role === Role.ADMIN}
      canPost={member.isActive}
      disabledReason="এই সদস্যের অ্যাকাউন্ট নিষ্ক্রিয় — নতুন বার্তা পাঠানো যাবে না।"
    />
  );
}
