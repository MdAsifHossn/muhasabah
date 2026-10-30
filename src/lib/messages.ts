import { Gender, Role, type PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { isStaffRole } from "@/lib/permissions";
import { prisma as sharedPrisma } from "@/lib/prisma";

/**
 * A long-running `next dev` may hold a Prisma client generated before the
 * `Message` model existed (same situation as comment-db.ts). In that case the
 * freshly generated client is loaded once from disk; otherwise the shared
 * client is used as-is.
 */
let messageClient: PrismaClient | null = null;
export function getMessageDb(): PrismaClient {
  if (messageClient) return messageClient;
  const knows = (client: unknown) => typeof (client as Record<string, unknown> | null)?.message === "object";
  if (knows(sharedPrisma)) return (messageClient = sharedPrisma);
  try {
    const requireFresh = createRequire(pathToFileURL(join(process.cwd(), "package.json")).href);
    for (const key of Object.keys(requireFresh.cache)) {
      if (/[\\/](@prisma[\\/]client|\.prisma[\\/]client)[\\/]/.test(key)) delete requireFresh.cache[key];
    }
    const generated = requireFresh("@prisma/client") as { PrismaClient: new () => PrismaClient };
    const client = new generated.PrismaClient();
    if (knows(client)) return (messageClient = client);
  } catch {
    /* fall back to the shared client */
  }
  return (messageClient = sharedPrisma);
}

const prisma = new Proxy({} as PrismaClient, { get: (_target, key) => Reflect.get(getMessageDb(), key) });

/**
 * Member ↔ Ustadh messaging. One thread per member (`Message.memberId`).
 *
 * Read flags: a message is created already "read" by its own side —
 * a member's message has `readByMember: true`, a staff message has
 * `readByStaff: true`. So "unread for staff" is simply `readByStaff: false`
 * and "unread for the member" is `readByMember: false`.
 */

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  senderName: string;
  fromStaff: boolean;
  mine: boolean;
  createdAt: string;
  editedAt: string | null;
  deleted: boolean;
  /** The other side has read it (for ✓✓ on own messages). */
  readByOther: boolean;
};

export type ChatViewer = { id: string; role: unknown };

const THREAD_LIMIT = 300;

export async function getThreadMessages(memberId: string, viewer: ChatViewer): Promise<ChatMessage[]> {
  const rows = await prisma.message.findMany({
    where: { memberId },
    orderBy: { createdAt: "desc" },
    take: THREAD_LIMIT,
    include: { sender: { select: { name: true, role: true } } },
  });
  return rows.reverse().map((row) => {
    const fromStaff = row.senderId !== memberId;
    return {
      id: row.id,
      body: row.deletedAt ? "" : row.body,
      senderId: row.senderId,
      senderName: row.sender.name,
      fromStaff,
      mine: row.senderId === viewer.id,
      createdAt: row.createdAt.toISOString(),
      editedAt: row.editedAt ? row.editedAt.toISOString() : null,
      deleted: Boolean(row.deletedAt),
      readByOther: fromStaff ? row.readByMember : row.readByStaff,
    };
  });
}

/** Opening a thread marks the other side's messages as read. */
export async function markThreadRead(memberId: string, viewer: ChatViewer) {
  if (isStaffRole(viewer.role)) {
    await prisma.message.updateMany({ where: { memberId, readByStaff: false }, data: { readByStaff: true } });
  } else if (viewer.id === memberId) {
    await prisma.message.updateMany({ where: { memberId, readByMember: false }, data: { readByMember: true } });
  }
}

/** Unread badge count: staff → all members' unread messages; member → unread replies in own thread. */
export async function getUnreadCountFor(user: ChatViewer): Promise<number> {
  if (isStaffRole(user.role)) return prisma.message.count({ where: { readByStaff: false, deletedAt: null } });
  return prisma.message.count({ where: { memberId: user.id, readByMember: false, deletedAt: null } });
}

/** Whether the viewer may read / post in this member's thread. */
export function canAccessThread(memberId: string, viewer: ChatViewer) {
  return isStaffRole(viewer.role) || viewer.id === memberId;
}

export type InboxThread = {
  memberId: string;
  name: string;
  gender: Gender;
  role: Role;
  isActive: boolean;
  lastBody: string;
  lastAt: string;
  lastFromStaff: boolean;
  lastDeleted: boolean;
  unread: number;
};

/** Staff inbox: one row per member thread, newest activity first. */
export async function getInboxThreads(): Promise<InboxThread[]> {
  const recent = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 2000,
    select: { memberId: true, senderId: true, body: true, createdAt: true, deletedAt: true, readByStaff: true },
  });
  const byMember = new Map<string, { last: (typeof recent)[number]; unread: number }>();
  for (const row of recent) {
    const current = byMember.get(row.memberId);
    const unread = !row.readByStaff && !row.deletedAt ? 1 : 0;
    if (!current) byMember.set(row.memberId, { last: row, unread });
    else current.unread += unread;
  }
  if (!byMember.size) return [];
  const members = await prisma.user.findMany({
    where: { id: { in: [...byMember.keys()] } },
    select: { id: true, name: true, gender: true, role: true, isActive: true },
  });
  return members
    .map((member) => {
      const entry = byMember.get(member.id)!;
      return {
        memberId: member.id,
        name: member.name,
        gender: member.gender,
        role: member.role,
        isActive: member.isActive,
        lastBody: entry.last.deletedAt ? "" : entry.last.body,
        lastAt: entry.last.createdAt.toISOString(),
        lastFromStaff: entry.last.senderId !== member.id,
        lastDeleted: Boolean(entry.last.deletedAt),
        unread: entry.unread,
      };
    })
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}
