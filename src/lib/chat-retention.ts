import { prisma } from "@/lib/prisma";


import { CHAT_RETENTION_DAYS } from "@/lib/chat-retention-days";
export { CHAT_RETENTION_DAYS };
const PURGE_EVERY_MS = 30 * 60 * 1000;
const BATCH = 5000;

let lastRun = 0;

/** Deletes chat messages (and their reactions, old notifications) older than the retention window. */
export async function purgeOldChat() {
  const cutoff = new Date(Date.now() - CHAT_RETENTION_DAYS * 86_400_000);
  const [direct, group] = await Promise.all([
    prisma.message.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true }, take: BATCH }),
    prisma.groupMessage.findMany({ where: { createdAt: { lt: cutoff } }, select: { id: true }, take: BATCH }),
  ]);
  const directIds = direct.map((row) => row.id);
  const groupIds = group.map((row) => row.id);
  const [reactionsDm, reactionsGroup, messages, groupMessages, notifications] = await Promise.all([
    directIds.length ? prisma.messageReaction.deleteMany({ where: { kind: "DM", messageId: { in: directIds } } }) : { count: 0 },
    groupIds.length ? prisma.messageReaction.deleteMany({ where: { kind: "GROUP", messageId: { in: groupIds } } }) : { count: 0 },
    directIds.length ? prisma.message.deleteMany({ where: { id: { in: directIds } } }) : { count: 0 },
    groupIds.length ? prisma.groupMessage.deleteMany({ where: { id: { in: groupIds } } }) : { count: 0 },
    prisma.notification.deleteMany({ where: { createdAt: { lt: cutoff } } }),
  ]);
  return { messages: messages.count, groupMessages: groupMessages.count, reactions: reactionsDm.count + reactionsGroup.count, notifications: notifications.count };
}

/** Cheap opportunistic cleanup: at most once per 30 minutes per server instance, never blocks or breaks a request. */
export function maybePurgeOldChat() {
  const now = Date.now();
  if (now - lastRun < PURGE_EVERY_MS) return;
  lastRun = now;
  void purgeOldChat().catch((error) => console.error("chat purge failed", error));
}
