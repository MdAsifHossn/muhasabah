"use server";

import { AmalInputType, DailyEntryStatus, Gender } from "@prisma/client";
import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAmalCommentClient } from "@/components/amalnama/comment-db";
import { actionError } from "@/lib/action-error";
import { applicableItems } from "@/lib/amal-rules";
import { getActiveCycle, isDateInsideCycle } from "@/lib/cycles";
import { bangladeshDateKey, getBangladeshToday, getBangladeshWeekday, startOfBangladeshDay } from "@/lib/dates";
import { isStaffRole, requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateAmalItemScore, calculateCompletionPercentage, calculateDailyMaximum } from "@/lib/scoring";

const entrySchema = z.object({
  intent: z.enum(["draft", "submit"]),
  personalNote: z.string().max(2000).optional(),
  day: z.enum(["today", "yesterday"]).default("today"),
});

function revalidateAmalnama() {
  revalidatePath("/dashboard", "layout");
}

/**
 * The day a member may write: today, or yesterday (so an amal finished after
 * midnight — or a forgotten evening — can still be recorded). Both must lie
 * inside the active cycle.
 */
async function resolveEntryDay(day: "today" | "yesterday") {
  const cycle = await getActiveCycle();
  if (!cycle) throw actionError(400, "বর্তমানে কোনো সক্রিয় সাইকেল নেই।");
  const today = startOfBangladeshDay(getBangladeshToday());
  const date = day === "yesterday" ? startOfBangladeshDay(addDays(today, -1)) : today;
  if (!isDateInsideCycle(date, cycle.startDate, cycle.endDate))
    throw actionError(400, day === "yesterday" ? "গতকালের তারিখ সক্রিয় সাইকেলের অন্তর্ভুক্ত নয়।" : "আজকের তারিখ সক্রিয় সাইকেলের অন্তর্ভুক্ত নয়।");
  return { cycle, date, weekday: getBangladeshWeekday(date) };
}

export async function saveDailyAmalnama(formData: FormData) {
  const session = await requireUser();
  const parsed = entrySchema.safeParse({
    intent: formData.get("intent"),
    personalNote: String(formData.get("personalNote") ?? ""),
    day: formData.get("day") || undefined,
  });
  if (!parsed.success) throw actionError(400, "জমা দেওয়া তথ্য সঠিক নয়।");

  const { cycle, date, weekday } = await resolveEntryDay(parsed.data.day);
  const [viewer, allItems, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { gender: true } }),
    prisma.amalItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.dailyAmalEntry.findUnique({ where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } } }),
  ]);
  if (existing?.status === DailyEntryStatus.LOCKED) throw actionError(403, "এই দিনের আমলনামা লক করা হয়েছে — আর পরিবর্তন করা যাবে না।");

  const isPeriodDay = existing?.isPeriodDay ?? false;
  const items = applicableItems(allItems, { gender: viewer?.gender ?? Gender.OTHER, weekday, isPeriodDay });
  const responses = items.map((item) => {
    const raw = formData.get(`item_${item.id}`);
    const value =
      item.inputType === AmalInputType.BOOLEAN
        ? raw === "on" || raw === "true"
        : item.inputType === AmalInputType.TEXT
          ? String(raw ?? "").trim()
          : Math.max(0, Number(raw ?? 0) || 0);
    const score = calculateAmalItemScore(item, value);
    return {
      amalItemId: item.id,
      valueBoolean: typeof value === "boolean" ? value : undefined,
      valueNumber: typeof value === "number" ? value : undefined,
      valueText: typeof value === "string" ? value : undefined,
      score,
      maxScore: item.points,
    };
  });
  const totalScore = Math.round(responses.reduce((sum, response) => sum + response.score, 0) * 100) / 100;
  // Answers for amals hidden today (e.g. prayers on a ওজর day) stay stored but unscored.
  const shownIds = new Set(items.map((item) => item.id));
  const keptResponses = [...responses, ...(existing?.responses ?? []).filter((response) => !shownIds.has(response.amalItemId))];
  const maxPossibleScore = calculateDailyMaximum(items);
  const requestedStatus = parsed.data.intent === "submit" ? DailyEntryStatus.SUBMITTED : DailyEntryStatus.DRAFT;
  // A submitted day stays submitted when the member later saves a correction as draft.
  const status = existing?.status === DailyEntryStatus.SUBMITTED ? DailyEntryStatus.SUBMITTED : requestedStatus;
  const completionPercentage = calculateCompletionPercentage(totalScore, maxPossibleScore);
  const submittedAt = status === DailyEntryStatus.SUBMITTED ? (existing?.submittedAt ?? new Date()) : null;

  await prisma.dailyAmalEntry.upsert({
    where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } },
    update: { responses: keptResponses, totalScore, maxPossibleScore, completionPercentage, personalNote: parsed.data.personalNote || null, status, submittedAt },
    create: { userId: session.user.id, cycleId: cycle.id, date, isPeriodDay: false, responses, totalScore, maxPossibleScore, completionPercentage, personalNote: parsed.data.personalNote || null, status, submittedAt },
  });

  revalidateAmalnama();
}

/**
 * Member-owned মাসিক toggle for today / yesterday. Women only, reversible.
 * Turning it on drops the prayer/fasting amals (`exemptOnPeriod`) from that
 * day's stored entry so the day is never counted as missed for them.
 */
export async function setPeriodDay(day: "today" | "yesterday" = "today") {
  const session = await requireUser();
  const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gender: true } });
  if (viewer?.gender !== Gender.FEMALE) throw actionError(403, "এই সেটিং শুধুমাত্র নারী সদস্যদের জন্য প্রযোজ্য।");

  const { cycle, date, weekday } = await resolveEntryDay(day === "yesterday" ? "yesterday" : "today");
  const existing = await prisma.dailyAmalEntry.findUnique({ where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } } });
  if (existing?.status === DailyEntryStatus.LOCKED) throw actionError(403, "এই দিনের আমলনামা লক করা হয়েছে।");
  const next = !existing?.isPeriodDay;

  const allItems = await prisma.amalItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  const items = applicableItems(allItems, { gender: viewer.gender, weekday, isPeriodDay: next });
  const ids = new Set(items.map((item) => item.id));
  // Keep every stored answer (so switching the ওজর day off restores the
  // prayer ticks); only the applicable ones are scored.
  const responses = existing?.responses ?? [];
  const totalScore = responses.filter((response) => ids.has(response.amalItemId)).reduce((sum, response) => sum + response.score, 0);
  const maxPossibleScore = calculateDailyMaximum(items);
  const data = { isPeriodDay: next, responses, totalScore, maxPossibleScore, completionPercentage: calculateCompletionPercentage(totalScore, maxPossibleScore) };

  if (existing) await prisma.dailyAmalEntry.update({ where: { id: existing.id }, data });
  else await prisma.dailyAmalEntry.create({ data: { userId: session.user.id, cycleId: cycle.id, date, status: DailyEntryStatus.DRAFT, ...data } });

  revalidateAmalnama();
  return { isPeriodDay: next, dateKey: bangladeshDateKey(date) };
}

const commentSchema = z.object({ memberId: z.string().regex(/^[a-f\d]{24}$/i), comment: z.string().trim().min(2).max(1000) });

/** Ustadh/Admin feedback on a member's Amalnama. Members can read, never write. */
export async function addAmalComment(formData: FormData) {
  const session = await requireUser();
  if (!isStaffRole(session.user.role)) throw actionError(403, "শুধুমাত্র অ্যাডমিন ও উস্তাদজি মন্তব্য রাখতে পারবেন।");
  const parsed = commentSchema.safeParse({ memberId: formData.get("memberId"), comment: formData.get("comment") });
  if (!parsed.success) throw actionError(400, "মন্তব্যটি সঠিক নয়। অন্তত ২ অক্ষর লিখুন।");

  const member = await prisma.user.findUnique({ where: { id: parsed.data.memberId }, select: { id: true, hideAmalnama: true } });
  if (!member) throw actionError(404, "সদস্যটি পাওয়া যায়নি।");
  if (member.hideAmalnama) throw actionError(403, "সদস্যটি তার আমলনামা লুকিয়ে রেখেছেন — মন্তব্য রাখা যাচ্ছে না।");

  const client = getAmalCommentClient();
  await client.amalComment.create({ data: { memberId: member.id, authorId: session.user.id, comment: parsed.data.comment } });
  revalidatePath("/dashboard", "layout");
}

/** Author (or an admin) removes a comment. */
export async function deleteAmalComment(commentId: string) {
  const session = await requireUser();
  if (!/^[a-f\d]{24}$/i.test(commentId)) throw actionError(400, "মন্তব্য ID সঠিক নয়।");
  const client = getAmalCommentClient();
  const comment = await client.amalComment.findUnique({ where: { id: commentId }, select: { authorId: true } });
  if (!comment) throw actionError(404, "মন্তব্যটি পাওয়া যায়নি।");
  if (comment.authorId !== session.user.id && session.user.role !== "ADMIN") throw actionError(403, "এই মন্তব্য মুছে ফেলার অনুমতি নেই।");
  await client.amalComment.delete({ where: { id: commentId } });
  revalidatePath("/dashboard", "layout");
}
