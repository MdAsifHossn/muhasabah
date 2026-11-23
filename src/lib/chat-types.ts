/** Client-safe chat constants and types (no database imports). */

/** Reactions offered in the picker (one per user per message, like Messenger). */
export const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🤲"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export type ReactionSummary = { emoji: string; count: number; mine: boolean };
export type ReplyPreview = { id: string; senderName: string; body: string; deleted: boolean };
export type MessageKind = "DM" | "GROUP";

export const isReactionEmoji = (value: unknown): value is ReactionEmoji => REACTION_EMOJIS.includes(value as ReactionEmoji);

export const previewText = (body: string, max = 80) => (body.length > max ? `${body.slice(0, max).trimEnd()}…` : body);

/** Same toggle rule as the server (same emoji removes, another replaces) — for instant UI updates. */
export function applyReaction(current: ReactionSummary[], emoji: string): ReactionSummary[] {
  const mine = current.find((entry) => entry.mine);
  let next = current.map((entry) => ({ ...entry }));
  if (mine) {
    next = next.map((entry) => (entry.mine ? { ...entry, count: entry.count - 1, mine: false } : entry)).filter((entry) => entry.count > 0);
    if (mine.emoji === emoji) return next;
  }
  const target = next.find((entry) => entry.emoji === emoji);
  if (target) {
    target.count += 1;
    target.mine = true;
  } else next.push({ emoji, count: 1, mine: true });
  return next.sort((a, b) => b.count - a.count);
}
