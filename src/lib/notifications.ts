import { AmalAudience, Gender, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * In-app notifications. Deliberately limited to three things:
 *  - a new chat message (to the other side of the thread),
 *  - a new notice from Ustadhji (to its audience),
 *  - a prayer-streak milestone (to Ustadhji) — every 40 days of unbroken
 *    তাকবীরে উলা / আউয়াল ওয়াক্ত.
 * Submitting / not submitting the daily amalnama never notifies anyone.
 *
 * Every helper is best-effort: a failed notification must never break the
 * action (sending a message, posting a notice, saving an amalnama) it hangs off.
 */
export type NotificationKind = "MESSAGE" | "NOTICE" | "STREAK";

type Draft = { kind: NotificationKind; title: string; body: string; href: string };

/** One streak notification per this many days. */
export const STREAK_MILESTONE_EVERY = 40;

async function upsertFor(userIds: string[], draft: Draft, keyOf: (userId: string) => string) {
  await Promise.all(
    userIds.map((userId) => {
      const dedupeKey = keyOf(userId);
      return prisma.notification.upsert({
        where: { userId_dedupeKey: { userId, dedupeKey } },
        create: { userId, dedupeKey, readAt: null, ...draft },
        // A repeat (e.g. another chat message in the same thread) refreshes the single entry and marks it unread again.
        update: { ...draft, readAt: null, createdAt: new Date() },
      });
    }),
  );
}

const preview = (text: string, max = 90) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

async function activeStaffIds(exceptId?: string) {
  const staff = await prisma.user.findMany({ where: { role: Role.USTADH, isActive: true, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
  return staff.map((user) => user.id);
}

export async function notifyNewMessage(input: { memberId: string; senderId: string; senderName: string; fromStaff: boolean; body: string }) {
  try {
    const draft = { kind: "MESSAGE" as const, body: preview(input.body) };
    if (input.fromStaff) {
      await upsertFor([input.memberId], { ...draft, title: "উস্তাদজির নতুন বার্তা", href: "/dashboard/messages" }, () => `thread:${input.memberId}:staff`);
    } else {
      const staffIds = await activeStaffIds(input.senderId);
      await upsertFor(staffIds, { ...draft, title: `${input.senderName} বার্তা পাঠিয়েছেন`, href: `/dashboard/ustad/messages/${input.memberId}` }, () => `thread:${input.memberId}:member`);
    }
  } catch (error) {
    console.error("notifyNewMessage failed", error);
  }
}

export async function notifyNewNotice(input: { noticeId: string; authorId: string; title: string; audience: AmalAudience }) {
  try {
    const gender = input.audience === AmalAudience.MALE ? Gender.MALE : input.audience === AmalAudience.FEMALE ? Gender.FEMALE : undefined;
    const members = await prisma.user.findMany({
      where: { role: Role.MEMBER, isActive: true, id: { not: input.authorId }, ...(gender ? { gender } : {}) },
      select: { id: true },
    });
    await upsertFor(members.map((member) => member.id), { kind: "NOTICE", title: "নতুন নোটিশ", body: preview(input.title), href: "/dashboard/notices" }, () => `notice:${input.noticeId}`);
  } catch (error) {
    console.error("notifyNewNotice failed", error);
  }
}

/** Called after a member saves their amalnama: tells Ustadhji when the running streak hits a milestone. */
export async function notifyStreakMilestone(input: { memberId: string; memberName: string; streak: number; label: string }) {
  if (input.streak <= 0 || input.streak % STREAK_MILESTONE_EVERY !== 0) return;
  try {
    const bnDays = input.streak.toLocaleString("bn-BD");
    await upsertFor(
      await activeStaffIds(input.memberId),
      { kind: "STREAK", title: `${input.memberName} — টানা ${bnDays} দিন ${input.label}`, body: `পাঁচ ওয়াক্তেই ${input.label} ধরে রেখে ${bnDays} দিন পূর্ণ করেছেন। মাশাআল্লাহ — একটু উৎসাহ দিন।`, href: `/dashboard/ustad/messages/${input.memberId}` },
      () => `streak:${input.memberId}:${input.streak}`,
    );
  } catch (error) {
    console.error("notifyStreakMilestone failed", error);
  }
}

/** Everyone in the group except the sender: one refreshed bell entry per group. */
export async function notifyGroupMessage(input: { groupId: string; groupName: string; senderId: string; senderName: string; memberIds: string[]; body: string }) {
  try {
    const recipients = input.memberIds.filter((id) => id !== input.senderId);
    await upsertFor(recipients, { kind: "MESSAGE", title: `${input.groupName} — ${input.senderName}`, body: preview(input.body), href: `/dashboard/groups?group=${input.groupId}` }, () => `group:${input.groupId}`);
  } catch (error) {
    console.error("notifyGroupMessage failed", error);
  }
}

export async function notifyGroupAdded(input: { groupId: string; groupName: string; byName: string; userIds: string[] }) {
  if (!input.userIds.length) return;
  try {
    await upsertFor(input.userIds, { kind: "MESSAGE", title: "নতুন গ্রুপে যোগ হয়েছেন", body: `${input.byName} আপনাকে "${input.groupName}" গ্রুপে যোগ করেছেন`, href: `/dashboard/groups?group=${input.groupId}` }, () => `group:${input.groupId}`);
  } catch (error) {
    console.error("notifyGroupAdded failed", error);
  }
}
