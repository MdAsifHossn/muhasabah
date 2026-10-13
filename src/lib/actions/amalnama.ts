"use server";

import { AmalInputType, DailyEntryStatus, Gender, Role, Weekday } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAmalCommentClient } from "@/components/amalnama/comment-db";
import { actionError } from "@/lib/action-error";
import { filterVisibleItems } from "@/lib/amal-audience";
import { getActiveCycle, isDateInsideCycle } from "@/lib/cycles";
import { getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateAmalItemScore, calculateCompletionPercentage, calculateDailyMaximum } from "@/lib/scoring";

const entrySchema = z.object({ intent: z.enum(["draft", "submit"]), personalNote: z.string().max(2000).optional() });
const weekdays: Weekday[] = [Weekday.SUNDAY, Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY, Weekday.SATURDAY];

function revalidateAmalnama() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/amalnama");
  revalidatePath("/dashboard/amalnama/history");
  revalidatePath("/dashboard/amalnama/grid");
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/leaderboard");
}

export async function saveDailyAmalnama(formData: FormData) {
  const session = await requireUser();
  const parsed = entrySchema.safeParse({ intent: formData.get("intent"), personalNote: String(formData.get("personalNote") ?? "") });
  if (!parsed.success) throw new Error("জমা দেওয়া তথ্য সঠিক নয়।");

  const cycle = await getActiveCycle();
  if (!cycle) throw new Error("বর্তমানে কোনো সক্রিয় সাইকেল নেই।");
  const date = startOfBangladeshDay(getBangladeshToday());
  if (!isDateInsideCycle(date, cycle.startDate, cycle.endDate)) throw new Error("আজকের তারিখ সক্রিয় সাইকেলের অন্তর্ভুক্ত নয়।");

  const currentDay = weekdays[new Date(date).getDay()];
  const [viewer, allItems, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { gender: true } }),
    prisma.amalItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.dailyAmalEntry.findUnique({ where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } } }),
  ]);
  // Only the member's audience (ALL + own gender scope) is rendered and scored —
  // a member is never scored against, or counted as "missed" for, another audience's amal.
  const audienceItems = filterVisibleItems(allItems, viewer?.gender ?? Gender.OTHER);
  // Period (মাসিক) day: prayer/fasting amals (`exemptOnPeriod`) are not
  // applicable — they are not rendered, not scored and never counted as missed.
  const isPeriodDay = existing?.isPeriodDay ?? false;
  const items = audienceItems.filter((item) => (!item.specificDay || item.specificDay === currentDay) && !(isPeriodDay && item.exemptOnPeriod));
  const responses = items.map((item) => {
    const raw = formData.get(`item_${item.id}`);
    const value = item.inputType === AmalInputType.BOOLEAN ? raw === "on" : item.inputType === AmalInputType.TEXT ? String(raw ?? "").trim() : Math.max(0, Number(raw ?? 0) || 0);
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
  const totalScore = responses.reduce((sum, response) => sum + response.score, 0);
  const maxPossibleScore = calculateDailyMaximum(items);
  const requestedStatus = parsed.data.intent === "submit" ? DailyEntryStatus.SUBMITTED : DailyEntryStatus.DRAFT;
  const status = existing?.status === DailyEntryStatus.SUBMITTED && requestedStatus === DailyEntryStatus.DRAFT ? DailyEntryStatus.SUBMITTED : requestedStatus;

  await prisma.dailyAmalEntry.upsert({
    where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } },
    update: { responses, totalScore, maxPossibleScore, completionPercentage: calculateCompletionPercentage(totalScore, maxPossibleScore), personalNote: parsed.data.personalNote || null, status, submittedAt: status === DailyEntryStatus.SUBMITTED ? new Date() : existing?.submittedAt },
    create: { userId: session.user.id, cycleId: cycle.id, date, isPeriodDay: false, responses, totalScore, maxPossibleScore, completionPercentage: calculateCompletionPercentage(totalScore, maxPossibleScore), personalNote: parsed.data.personalNote || null, status, submittedAt: status === DailyEntryStatus.SUBMITTED ? new Date() : null },
  });

  revalidateAmalnama();
}

/**
 * Member-owned মাসিক (menstruation) toggle for today.
 *
 * Only women can use it; it is reversible, and turning it on drops the
 * prayer/fasting amals (`exemptOnPeriod`) from today's stored entry so the
 * day is never counted as "missed" for those amals. Supervisors only see a
 * neutral "মাসিক" marker in reports — the toggle itself stays private.
 */
export async function setPeriodDay() {
  const session = await requireUser();
  const viewer = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gender: true } });
  if (viewer?.gender !== Gender.FEMALE) throw actionError(403, "এই সেটিং শুধুমাত্র নারী সদস্যদের জন্য প্রযোজ্য।");

  const cycle = await getActiveCycle();
  if (!cycle) throw actionError(400, "বর্তমানে কোনো সক্রিয় সাইকেল নেই।");
  const date = startOfBangladeshDay(getBangladeshToday());
  if (!isDateInsideCycle(date, cycle.startDate, cycle.endDate)) throw actionError(400, "আজকের তারিখ সক্রিয় সাইকেলের অন্তর্ভুক্ত নয়।");

  const existing = await prisma.dailyAmalEntry.findUnique({ where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } } });
  const next = !existing?.isPeriodDay;

  // Re-score the day against the applicable amals so a period day never keeps
  // a prayer/fasting row (or its maximum) in the stored totals.
  const day = weekdays[new Date(date).getDay()];
  const audienceItems = filterVisibleItems(await prisma.amalItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }), viewer.gender);
  const dayItems = audienceItems.filter((item) => !item.specificDay || item.specificDay === day);
  const applicableItems = next ? dayItems.filter((item) => !item.exemptOnPeriod) : dayItems;
  const applicableIds = new Set(applicableItems.map((item) => item.id));
  const responses = (existing?.responses ?? []).filter((response) => applicableIds.has(response.amalItemId));
  const totalScore = responses.reduce((sum, response) => sum + response.score, 0);
  const maxPossibleScore = calculateDailyMaximum(applicableItems);
  const data = {
    isPeriodDay: next,
    responses,
    totalScore,
    maxPossibleScore,
    completionPercentage: calculateCompletionPercentage(totalScore, maxPossibleScore),
  };

  if (existing) await prisma.dailyAmalEntry.update({ where: { id: existing.id }, data });
  else await prisma.dailyAmalEntry.create({ data: { userId: session.user.id, cycleId: cycle.id, date, status: DailyEntryStatus.DRAFT, ...data } });

  revalidateAmalnama();
}

const commentSchema = z.object({ memberId: z.string().regex(/^[a-f\d]{24}$/i), comment: z.string().trim().min(2).max(1000) });

/**
 * Ustadh/Admin leaves feedback on a member's Amalnama (`AmalComment.memberId`).
 * Ordinary members can read the comments on the list page but never write them —
 * the explicit ADMIN/USTADH role check (403) enforces that here.
 *
 * Failures carry a real HTTP status (400/403/404) instead of a raw 500: the
 * error digest produced by `actionError()` is what Next.js turns into the
 * status code, and the client surfaces the Bengali message in a toast.
 */
export async function addAmalComment(formData: FormData) {
  const session = await requireUser();
  const role = session.user.role as Role;
  // Checked here (not via requireRole's redirect): a server action must answer
  // 403 so the client toast can show the Bengali message instead of a redirect.
  if (role !== Role.ADMIN && role !== Role.USTADH) throw actionError(403, "শুধুমাত্র অ্যাডমিন ও উস্তাদজি মন্তব্য রাখতে পারবেন।");
  const parsed = commentSchema.safeParse({ memberId: formData.get("memberId"), comment: formData.get("comment") });
  if (!parsed.success) throw actionError(400, "মন্তব্যটি সঠিক নয়। অন্তত ২ অক্ষর লিখুন।");

  const member = await prisma.user.findUnique({ where: { id: parsed.data.memberId }, select: { id: true, hideAmalnama: true } });
  if (!member) throw actionError(404, "সদস্যটি পাওয়া যায়নি।");
  if (member.hideAmalnama) throw actionError(403, "সদস্যটি তার আমলনামা লুকিয়ে রেখেছেন — মন্তব্য রাখা যাচ্ছে না।");

  const client = getAmalCommentClient();
  if (typeof (client as unknown as Record<string, unknown>).amalComment !== "object")
    throw actionError(503, "মন্তব্য ব্যবস্থা এই মুহূর্তে সাময়িকভাবে অনুপলব্ধ। কিছুক্ষণ পরে আবার চেষ্টা করুন।");

  await client.amalComment.create({ data: { memberId: member.id, authorId: session.user.id, comment: parsed.data.comment } });
  revalidatePath("/dashboard/amalnama/list");
}
