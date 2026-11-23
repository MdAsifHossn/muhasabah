"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError } from "@/lib/action-error";
import { canManageGroups, GROUP_MEMBER_LIMIT, getGroupMessages, isGroupMember } from "@/lib/chat-groups";
import { isReactionEmoji, loadReactions, previewText, type MessageKind } from "@/lib/chat-shared";
import type { ChatMessage } from "@/lib/messages";
import { canAccessThread } from "@/lib/messages";
import { notifyGroupAdded, notifyGroupMessage } from "@/lib/notifications";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const nameSchema = z.string().trim().min(2, "গ্রুপের নাম অন্তত ২ অক্ষর").max(60, "গ্রুপের নাম ৬০ অক্ষরের বেশি হবে না");
const bodySchema = z.string().trim().min(1, "বার্তা খালি রাখা যাবে না।").max(2000, "বার্তা ২০০০ অক্ষরের বেশি হতে পারবে না।");

function refresh() {
  revalidatePath("/dashboard/groups", "layout");
}

async function requireMember(groupId: string, userId: string) {
  if (!objectId.safeParse(groupId).success) throw actionError(400, "গ্রুপ ID সঠিক নয়।");
  const member = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { isAdmin: true } });
  if (!member) throw actionError(403, "আপনি এই গ্রুপের সদস্য নন।");
  return member;
}

async function requireGroupPermission(userId: string) {
  if (!(await canManageGroups(userId))) throw actionError(403, "গ্রুপ তৈরি ও সদস্য যোগ করার অনুমতি উস্তাদজি দেন। অনুমতির জন্য উস্তাদজিকে বলুন।");
}

async function requireAdmin(groupId: string, userId: string) {
  const member = await requireMember(groupId, userId);
  if (!member.isAdmin) throw actionError(403, "শুধু গ্রুপ অ্যাডমিন এটি করতে পারবেন।");
}

/** Active people the signed-in user can add (name search; never exposes emails). */
export async function searchChatUsers(query: string) {
  const session = await requireUser();
  await requireGroupPermission(session.user.id);
  const term = String(query ?? "").trim().slice(0, 60);
  const users = await prisma.user.findMany({
    where: { isActive: true, id: { not: session.user.id }, ...(term ? { name: { contains: term, mode: "insensitive" } } : {}) },
    orderBy: { name: "asc" },
    take: 20,
    select: { id: true, name: true, gender: true, role: true },
  });
  return users.map((user) => ({ id: user.id, name: user.name, gender: user.gender, isUstadh: user.role === Role.USTADH }));
}

async function activeUserIds(ids: string[], exceptId: string) {
  const unique = [...new Set(ids.filter((id) => objectId.safeParse(id).success && id !== exceptId))];
  if (!unique.length) return [];
  const users = await prisma.user.findMany({ where: { id: { in: unique }, isActive: true }, select: { id: true } });
  return users.map((user) => user.id);
}

/** Anyone can start a group and add the people they want; the creator is its first admin. */
export async function createGroup(input: { name: string; memberIds: string[] }): Promise<{ id: string }> {
  const session = await requireUser();
  await requireGroupPermission(session.user.id);
  const name = nameSchema.safeParse(input.name);
  if (!name.success) throw actionError(400, name.error.issues[0]?.message ?? "গ্রুপের নাম সঠিক নয়।");
  const memberIds = (await activeUserIds(input.memberIds ?? [], session.user.id)).slice(0, GROUP_MEMBER_LIMIT - 1);
  const group = await prisma.chatGroup.create({
    data: {
      name: name.data,
      createdById: session.user.id,
      members: { create: [{ userId: session.user.id, isAdmin: true }, ...memberIds.map((userId) => ({ userId }))] },
    },
    select: { id: true },
  });
  await notifyGroupAdded({ groupId: group.id, groupName: name.data, byName: session.user.name, userIds: memberIds });
  refresh();
  return group;
}

export async function addGroupMembers(input: { groupId: string; userIds: string[] }) {
  const session = await requireUser();
  await requireGroupPermission(session.user.id);
  await requireAdmin(input.groupId, session.user.id);
  const group = await prisma.chatGroup.findUnique({ where: { id: input.groupId }, select: { name: true, _count: { select: { members: true } } } });
  if (!group) throw actionError(404, "গ্রুপটি পাওয়া যায়নি।");
  const existing = new Set((await prisma.groupMember.findMany({ where: { groupId: input.groupId }, select: { userId: true } })).map((row) => row.userId));
  const fresh = (await activeUserIds(input.userIds ?? [], session.user.id)).filter((id) => !existing.has(id));
  if (group._count.members + fresh.length > GROUP_MEMBER_LIMIT) throw actionError(400, `গ্রুপে সর্বোচ্চ ${GROUP_MEMBER_LIMIT} জন সদস্য থাকতে পারবেন।`);
  if (!fresh.length) return;
  await prisma.groupMember.createMany({ data: fresh.map((userId) => ({ groupId: input.groupId, userId })) });
  await notifyGroupAdded({ groupId: input.groupId, groupName: group.name, byName: session.user.name, userIds: fresh });
  refresh();
}

export async function removeGroupMember(input: { groupId: string; userId: string }) {
  const session = await requireUser();
  await requireAdmin(input.groupId, session.user.id);
  if (!objectId.safeParse(input.userId).success) throw actionError(400, "সদস্য সঠিক নয়।");
  const group = await prisma.chatGroup.findUnique({ where: { id: input.groupId }, select: { createdById: true } });
  if (input.userId === group?.createdById) throw actionError(403, "গ্রুপের নির্মাতাকে সরানো যায় না।");
  if (input.userId === session.user.id) throw actionError(400, "নিজেকে সরাতে \"গ্রুপ ছাড়ুন\" ব্যবহার করুন।");
  await prisma.groupMember.deleteMany({ where: { groupId: input.groupId, userId: input.userId } });
  refresh();
}

/** Leaving hands admin rights to the longest-standing member when nobody else is admin; an empty group is deleted. */
export async function leaveGroup(groupId: string) {
  const session = await requireUser();
  await requireMember(groupId, session.user.id);
  await prisma.groupMember.deleteMany({ where: { groupId, userId: session.user.id } });
  const rest = await prisma.groupMember.findMany({ where: { groupId }, orderBy: { joinedAt: "asc" }, select: { id: true, isAdmin: true } });
  if (!rest.length) await prisma.chatGroup.deleteMany({ where: { id: groupId } });
  else if (!rest.some((member) => member.isAdmin)) await prisma.groupMember.update({ where: { id: rest[0].id }, data: { isAdmin: true } });
  refresh();
}

export async function renameGroup(input: { groupId: string; name: string }) {
  const session = await requireUser();
  await requireAdmin(input.groupId, session.user.id);
  const name = nameSchema.safeParse(input.name);
  if (!name.success) throw actionError(400, name.error.issues[0]?.message ?? "গ্রুপের নাম সঠিক নয়।");
  await prisma.chatGroup.update({ where: { id: input.groupId }, data: { name: name.data } });
  refresh();
}

/** Only the creator can delete the whole group. */
export async function deleteGroup(groupId: string) {
  const session = await requireUser();
  await requireMember(groupId, session.user.id);
  const group = await prisma.chatGroup.findUnique({ where: { id: groupId }, select: { createdById: true } });
  if (group?.createdById !== session.user.id) throw actionError(403, "শুধু গ্রুপের নির্মাতা গ্রুপ মুছতে পারবেন।");
  const messageIds = (await prisma.groupMessage.findMany({ where: { groupId }, select: { id: true } })).map((row) => row.id);
  if (messageIds.length) await prisma.messageReaction.deleteMany({ where: { kind: "GROUP", messageId: { in: messageIds } } });
  await prisma.groupMessage.deleteMany({ where: { groupId } });
  await prisma.groupMember.deleteMany({ where: { groupId } });
  await prisma.chatGroup.delete({ where: { id: groupId } });
  refresh();
}

export async function sendGroupMessage(input: { groupId: string; body: string; replyToId?: string | null }): Promise<ChatMessage> {
  const session = await requireUser();
  await requireMember(input.groupId, session.user.id);
  const parsed = bodySchema.safeParse(input.body);
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "বার্তাটি সঠিক নয়।");

  let replyTo: ChatMessage["replyTo"] = null;
  let replyToId: string | undefined;
  if (input.replyToId && objectId.safeParse(input.replyToId).success) {
    const quoted = await prisma.groupMessage.findFirst({ where: { id: input.replyToId, groupId: input.groupId }, include: { sender: { select: { name: true } } } });
    if (quoted) {
      replyToId = quoted.id;
      replyTo = { id: quoted.id, senderName: quoted.sender.name, body: quoted.deletedAt ? "" : previewText(quoted.body), deleted: Boolean(quoted.deletedAt) };
    }
  }
  const created = await prisma.groupMessage.create({ data: { groupId: input.groupId, senderId: session.user.id, body: parsed.data, replyToId } });
  const group = await prisma.chatGroup.update({ where: { id: input.groupId }, data: { lastMessageAt: created.createdAt }, select: { name: true, members: { select: { userId: true } } } });
  await prisma.groupMember.updateMany({ where: { groupId: input.groupId, userId: session.user.id }, data: { lastReadAt: created.createdAt } });
  await notifyGroupMessage({ groupId: input.groupId, groupName: group.name, senderId: session.user.id, senderName: session.user.name, memberIds: group.members.map((member) => member.userId), body: parsed.data });
  refresh();
  return {
    id: created.id,
    body: created.body,
    senderId: session.user.id,
    senderName: session.user.name,
    fromStaff: false,
    mine: true,
    createdAt: created.createdAt.toISOString(),
    editedAt: null,
    deleted: false,
    readByOther: false,
    replyTo,
    reactions: [],
  };
}

async function ownGroupMessage(id: string, userId: string, allowAdmin: boolean) {
  if (!objectId.safeParse(id).success) throw actionError(400, "বার্তা ID সঠিক নয়।");
  const message = await prisma.groupMessage.findUnique({ where: { id }, select: { id: true, groupId: true, senderId: true, deletedAt: true } });
  if (!message) throw actionError(404, "বার্তাটি পাওয়া যায়নি।");
  const member = await requireMember(message.groupId, userId);
  if (message.senderId !== userId && !(allowAdmin && member.isAdmin)) throw actionError(403, "শুধু নিজের বার্তা পরিবর্তন করা যায়।");
  if (message.deletedAt) throw actionError(400, "বার্তাটি আগেই মুছে ফেলা হয়েছে।");
  return message;
}

export async function editGroupMessage(input: { id: string; body: string }) {
  const session = await requireUser();
  const message = await ownGroupMessage(input.id, session.user.id, false);
  const parsed = bodySchema.safeParse(input.body);
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "বার্তাটি সঠিক নয়।");
  await prisma.groupMessage.update({ where: { id: message.id }, data: { body: parsed.data, editedAt: new Date() } });
}

/** The sender or a group admin can remove a message. */
export async function deleteGroupMessage(id: string) {
  const session = await requireUser();
  const message = await ownGroupMessage(id, session.user.id, true);
  await prisma.groupMessage.update({ where: { id: message.id }, data: { deletedAt: new Date(), body: "" } });
  await prisma.messageReaction.deleteMany({ where: { kind: "GROUP", messageId: message.id } });
}

/** Group poll helper for server components. */
export async function loadGroupThread(groupId: string) {
  const session = await requireUser();
  if (!(await isGroupMember(groupId, session.user.id))) throw actionError(403, "আপনি এই গ্রুপের সদস্য নন।");
  return getGroupMessages(groupId, session.user.id);
}

/**
 * One emoji reaction per user per message: same emoji again removes it, a different one replaces it.
 * Works for private (DM) and group messages. Returns the message's new reaction summary.
 */
export async function toggleReaction(input: { kind: MessageKind; messageId: string; emoji: string }) {
  const session = await requireUser();
  const { kind, messageId, emoji } = input;
  if ((kind !== "DM" && kind !== "GROUP") || !objectId.safeParse(messageId).success || !isReactionEmoji(emoji)) throw actionError(400, "প্রতিক্রিয়া সঠিক নয়।");

  if (kind === "DM") {
    const message = await prisma.message.findUnique({ where: { id: messageId }, select: { memberId: true, deletedAt: true } });
    if (!message || message.deletedAt || !canAccessThread(message.memberId, { id: session.user.id, role: session.user.role })) throw actionError(404, "বার্তাটি পাওয়া যায়নি।");
  } else {
    const message = await prisma.groupMessage.findUnique({ where: { id: messageId }, select: { groupId: true, deletedAt: true } });
    if (!message || message.deletedAt) throw actionError(404, "বার্তাটি পাওয়া যায়নি।");
    await requireMember(message.groupId, session.user.id);
  }

  const where = { kind_messageId_userId: { kind, messageId, userId: session.user.id } };
  const existing = await prisma.messageReaction.findUnique({ where });
  if (existing?.emoji === emoji) await prisma.messageReaction.delete({ where });
  else if (existing) await prisma.messageReaction.update({ where, data: { emoji } });
  else await prisma.messageReaction.create({ data: { kind, messageId, userId: session.user.id, emoji } });
  return (await loadReactions(kind, [messageId], session.user.id)).get(messageId) ?? [];
}
