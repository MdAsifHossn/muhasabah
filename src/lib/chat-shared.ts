import { prisma } from "@/lib/prisma";
import type { MessageKind, ReactionSummary } from "@/lib/chat-types";

export { isReactionEmoji, previewText, REACTION_EMOJIS } from "@/lib/chat-types";
export type { MessageKind, ReactionEmoji, ReactionSummary, ReplyPreview } from "@/lib/chat-types";

/** Reactions of many messages at once, grouped per message and sorted by popularity. */
export async function loadReactions(kind: MessageKind, messageIds: string[], viewerId: string) {
  const result = new Map<string, ReactionSummary[]>();
  if (!messageIds.length) return result;
  const rows = await prisma.messageReaction.findMany({ where: { kind, messageId: { in: messageIds } }, select: { messageId: true, userId: true, emoji: true } });
  const perMessage = new Map<string, Map<string, ReactionSummary>>();
  for (const row of rows) {
    const byEmoji = perMessage.get(row.messageId) ?? new Map<string, ReactionSummary>();
    const entry = byEmoji.get(row.emoji) ?? { emoji: row.emoji, count: 0, mine: false };
    entry.count += 1;
    if (row.userId === viewerId) entry.mine = true;
    byEmoji.set(row.emoji, entry);
    perMessage.set(row.messageId, byEmoji);
  }
  for (const [messageId, byEmoji] of perMessage) result.set(messageId, [...byEmoji.values()].sort((a, b) => b.count - a.count));
  return result;
}
