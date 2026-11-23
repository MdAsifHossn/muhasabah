import type { Gender, Role } from "@prisma/client";

import { loadReactions, previewText } from "@/lib/chat-shared";
import { maybePurgeOldChat } from "@/lib/chat-retention";
import type { ChatMessage } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

export const GROUP_MEMBER_LIMIT = 200;

/** Ustadhji always may; a member only when Ustadhji switched "group creator" on for them. Read fresh from the database. */
export async function canManageGroups(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true, groupCreator: true } });
  return Boolean(user?.isActive && (user.role === "USTADH" || user.groupCreator === true));
}

export type GroupSummary = {
  id: string;
  name: string;
  memberCount: number;
  lastBody: string;
  lastSender: string;
  lastAt: string;
  lastDeleted: boolean;
  unread: number;
  isAdmin: boolean;
};

export type GroupMemberView = { userId: string; name: string; gender: Gender; role: Role; isAdmin: boolean; isCreator: boolean };
export type GroupDetail = { id: string; name: string; createdById: string; isAdmin: boolean; members: GroupMemberView[] };

/** Groups the user belongs to, most recently active first, with unread counts. */
export async function listGroups(userId: string): Promise<GroupSummary[]> {
  maybePurgeOldChat();
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { isAdmin: true, lastReadAt: true, group: { select: { id: true, name: true, lastMessageAt: true, _count: { select: { members: true } } } } },
  });
  const rows = await Promise.all(
    memberships.map(async ({ isAdmin, lastReadAt, group }) => {
      const [last, unread] = await Promise.all([
        prisma.groupMessage.findFirst({ where: { groupId: group.id }, orderBy: { createdAt: "desc" }, select: { body: true, deletedAt: true, createdAt: true, sender: { select: { name: true } } } }),
        prisma.groupMessage.count({ where: { groupId: group.id, createdAt: { gt: lastReadAt }, senderId: { not: userId }, deletedAt: null } }),
      ]);
      return {
        id: group.id,
        name: group.name,
        memberCount: group._count.members,
        lastBody: last && !last.deletedAt ? previewText(last.body, 70) : "",
        lastSender: last?.sender.name ?? "",
        lastAt: (last?.createdAt ?? group.lastMessageAt).toISOString(),
        lastDeleted: Boolean(last?.deletedAt),
        unread,
        isAdmin,
      } satisfies GroupSummary;
    }),
  );
  return rows.sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

/** Group + members, only for someone who is a member of it. */
export async function getGroupDetail(groupId: string, userId: string): Promise<GroupDetail | null> {
  const group = await prisma.chatGroup.findUnique({
    where: { id: groupId },
    select: { id: true, name: true, createdById: true, members: { select: { userId: true, isAdmin: true, joinedAt: true, user: { select: { name: true, gender: true, role: true } } }, orderBy: { joinedAt: "asc" } } },
  });
  const me = group?.members.find((member) => member.userId === userId);
  if (!group || !me) return null;
  return {
    id: group.id,
    name: group.name,
    createdById: group.createdById,
    isAdmin: me.isAdmin,
    members: group.members.map((member) => ({ userId: member.userId, name: member.user.name, gender: member.user.gender, role: member.user.role, isAdmin: member.isAdmin, isCreator: member.userId === group.createdById })),
  };
}

export async function isGroupMember(groupId: string, userId: string) {
  return Boolean(await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { id: true } }));
}

const LIMIT = 300;

export async function getGroupMessages(groupId: string, viewerId: string): Promise<ChatMessage[]> {
  maybePurgeOldChat();
  const rows = await prisma.groupMessage.findMany({ where: { groupId }, orderBy: { createdAt: "desc" }, take: LIMIT, include: { sender: { select: { name: true } } } });
  rows.reverse();
  const byId = new Map(rows.map((row) => [row.id, row]));
  const missing = [...new Set(rows.map((row) => row.replyToId).filter((id): id is string => Boolean(id) && !byId.has(id as string)))];
  if (missing.length) for (const older of await prisma.groupMessage.findMany({ where: { id: { in: missing }, groupId }, include: { sender: { select: { name: true } } } })) byId.set(older.id, older);
  const reactions = await loadReactions("GROUP", rows.map((row) => row.id), viewerId);
  return rows.map((row) => {
    const quoted = row.replyToId ? byId.get(row.replyToId) : undefined;
    return {
      id: row.id,
      body: row.deletedAt ? "" : row.body,
      senderId: row.senderId,
      senderName: row.sender.name,
      fromStaff: false,
      mine: row.senderId === viewerId,
      createdAt: row.createdAt.toISOString(),
      editedAt: row.editedAt ? row.editedAt.toISOString() : null,
      deleted: Boolean(row.deletedAt),
      readByOther: false,
      replyTo: row.replyToId ? { id: row.replyToId, senderName: quoted?.sender.name ?? "", body: quoted && !quoted.deletedAt ? previewText(quoted.body) : "", deleted: !quoted || Boolean(quoted.deletedAt) } : null,
      reactions: reactions.get(row.id) ?? [],
    };
  });
}

/** Opening a group: everything up to now counts as read, and its bell entry is cleared. */
export async function markGroupRead(groupId: string, userId: string) {
  await prisma.groupMember.updateMany({ where: { groupId, userId }, data: { lastReadAt: new Date() } });
  try {
    await prisma.notification.updateMany({ where: { userId, dedupeKey: `group:${groupId}`, OR: [{ readAt: null }, { readAt: { isSet: false } }] }, data: { readAt: new Date() } });
  } catch {
    /* best effort */
  }
}

/** Total unread group messages (for badges). */
export async function groupUnreadTotal(userId: string) {
  const groups = await listGroups(userId);
  return groups.reduce((sum, group) => sum + group.unread, 0);
}
