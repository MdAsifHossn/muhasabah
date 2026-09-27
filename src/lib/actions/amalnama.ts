"use server";

import { AmalInputType, DailyEntryStatus, Weekday } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getActiveCycle, isDateInsideCycle } from "@/lib/cycles";
import { getBangladeshToday, startOfBangladeshDay } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { calculateAmalItemScore, calculateCompletionPercentage, calculateDailyMaximum } from "@/lib/scoring";

const entrySchema = z.object({ intent: z.enum(["draft", "submit"]), personalNote: z.string().max(2000).optional() });
const weekdays: Weekday[] = [Weekday.SUNDAY, Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY, Weekday.SATURDAY];

export async function saveDailyAmalnama(formData: FormData) {
  const session = await requireUser();
  const parsed = entrySchema.safeParse({ intent: formData.get("intent"), personalNote: String(formData.get("personalNote") ?? "") });
  if (!parsed.success) throw new Error("জমা দেওয়া তথ্য সঠিক নয়।");

  const cycle = await getActiveCycle();
  if (!cycle) throw new Error("বর্তমানে কোনো সক্রিয় সাইকেল নেই।");
  const date = startOfBangladeshDay(getBangladeshToday());
  if (!isDateInsideCycle(date, cycle.startDate, cycle.endDate)) throw new Error("আজকের তারিখ সক্রিয় সাইকেলের অন্তর্ভুক্ত নয়।");

  const currentDay = weekdays[new Date(date).getDay()];
  const allItems = await prisma.amalItem.findMany({ where: { isActive: true }, orderBy: { order: "asc" } });
  const items = allItems.filter((item) => !item.specificDay || item.specificDay === currentDay);
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
  const existing = await prisma.dailyAmalEntry.findUnique({ where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } } });
  const requestedStatus = parsed.data.intent === "submit" ? DailyEntryStatus.SUBMITTED : DailyEntryStatus.DRAFT;
  const status = existing?.status === DailyEntryStatus.SUBMITTED && requestedStatus === DailyEntryStatus.DRAFT ? DailyEntryStatus.SUBMITTED : requestedStatus;

  await prisma.dailyAmalEntry.upsert({
    where: { userId_cycleId_date: { userId: session.user.id, cycleId: cycle.id, date } },
    update: { responses, totalScore, maxPossibleScore, completionPercentage: calculateCompletionPercentage(totalScore, maxPossibleScore), personalNote: parsed.data.personalNote || null, status, submittedAt: status === DailyEntryStatus.SUBMITTED ? new Date() : existing?.submittedAt },
    create: { userId: session.user.id, cycleId: cycle.id, date, responses, totalScore, maxPossibleScore, completionPercentage: calculateCompletionPercentage(totalScore, maxPossibleScore), personalNote: parsed.data.personalNote || null, status, submittedAt: status === DailyEntryStatus.SUBMITTED ? new Date() : null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/amalnama");
  revalidatePath("/dashboard/amalnama/history");
  revalidatePath("/dashboard/progress");
  revalidatePath("/dashboard/leaderboard");
}