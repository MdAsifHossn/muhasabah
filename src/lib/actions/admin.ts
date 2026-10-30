"use server";

import { AmalAudience, AmalCategory, AmalInputType, CycleStatus, Role, Weekday } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { syncAmalCatalog } from "../../../prisma/amal-catalog";
import { actionError } from "@/lib/action-error";
import { endOfBangladeshDay, startOfBangladeshDay } from "@/lib/dates";
import { requireAdmin, requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

/** Any amal-item / cycle / review change touches the whole dashboard (forms, reports, panels). */
function refreshDashboard() {
  revalidatePath("/dashboard", "layout");
}

type StaffSession = Awaited<ReturnType<typeof requireUstadhOrAdmin>>;

/**
 * Ownership rule, always re-checked from the database:
 * - ADMIN may modify any amal item.
 * - USTADH may modify only items they created (`createdById === their id`).
 * - `createdById === null` is the system default list → ADMIN only.
 */
async function requireAmalItem(session: StaffSession, itemId: string) {
  const item = await prisma.amalItem.findUnique({ where: { id: itemId } });
  if (!item) throw actionError(404, "আমল আইটেম পাওয়া যায়নি।");
  const isAdmin = session.user.role === Role.ADMIN;
  const isOwner = item.createdById !== null && item.createdById === session.user.id;
  if (!isAdmin && !isOwner) throw actionError(403, "এই আমল আইটেম পরিবর্তন করার অনুমতি আপনার নেই — শুধু নিজের যোগ করা আমল সম্পাদনা করা যায়।");
  return item;
}

/** HTML checkbox: present ("on") = true, absent = false. */
const checkbox = (formData: FormData, name: string) => formData.get(name) === "on" || formData.get(name) === "true";
const optionalText = (value: FormDataEntryValue | null) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : undefined;
};

const itemSchema = z.object({
  titleBn: z.string().trim().min(2, "আমলের নাম অন্তত ২ অক্ষর").max(160),
  description: z.string().trim().max(500).optional(),
  category: z.enum(AmalCategory),
  inputType: z.enum(AmalInputType),
  targetValue: z.coerce.number().min(0).max(100000).optional(),
  unit: z.string().trim().max(40).optional(),
  points: z.coerce.number().positive("পয়েন্ট ০-এর বেশি হতে হবে").max(100),
  specificDay: z.enum(Weekday).optional(),
  genderScope: z.enum(AmalAudience).default(AmalAudience.ALL),
});

function parseItem(formData: FormData) {
  const parsed = itemSchema.safeParse({
    titleBn: formData.get("titleBn"),
    description: optionalText(formData.get("description")),
    category: formData.get("category"),
    inputType: formData.get("inputType"),
    targetValue: optionalText(formData.get("targetValue")),
    unit: optionalText(formData.get("unit")),
    points: formData.get("points"),
    specificDay: optionalText(formData.get("specificDay")),
    genderScope: optionalText(formData.get("genderScope")),
  });
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "আমল আইটেমের তথ্য সঠিক নয়।");
  // Yes/No and free-text amals never carry a numeric target.
  const numeric = parsed.data.inputType !== AmalInputType.BOOLEAN && parsed.data.inputType !== AmalInputType.TEXT;
  return {
    ...parsed.data,
    description: parsed.data.description ?? null,
    targetValue: numeric ? (parsed.data.targetValue ?? null) : null,
    unit: numeric ? (parsed.data.unit ?? null) : null,
    specificDay: parsed.data.specificDay ?? null,
    isActive: checkbox(formData, "isActive"),
    isRequired: checkbox(formData, "isRequired"),
    exemptOnPeriod: checkbox(formData, "exemptOnPeriod"),
  };
}

export async function createAmalItem(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const data = parseItem(formData);
  const last = await prisma.amalItem.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.amalItem.create({ data: { ...data, order: (last?.order ?? 0) + 10, createdById: session.user.id } });
  refreshDashboard();
}

export async function updateAmalItem(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const itemId = objectId.safeParse(formData.get("itemId"));
  if (!itemId.success) throw actionError(400, "আমল আইটেম ID সঠিক নয়।");
  const item = await requireAmalItem(session, itemId.data);
  await prisma.amalItem.update({ where: { id: item.id }, data: parseItem(formData) });
  refreshDashboard();
}

/** Quick on/off switch from the item card. */
export async function toggleAmalItem(itemId: string) {
  const session = await requireUstadhOrAdmin();
  if (!objectId.safeParse(itemId).success) throw actionError(400, "আমল আইটেম ID সঠিক নয়।");
  const item = await requireAmalItem(session, itemId);
  await prisma.amalItem.update({ where: { id: item.id }, data: { isActive: !item.isActive } });
  refreshDashboard();
}

/** Swap an item with its neighbour above / below in the global display order. */
export async function moveAmalItem(itemId: string, direction: "up" | "down") {
  const session = await requireUstadhOrAdmin();
  if (!objectId.safeParse(itemId).success || (direction !== "up" && direction !== "down")) throw actionError(400, "তথ্য সঠিক নয়।");
  const item = await requireAmalItem(session, itemId);
  const neighbour = await prisma.amalItem.findFirst({
    where: direction === "up" ? { order: { lt: item.order } } : { order: { gt: item.order } },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
    select: { id: true, order: true },
  });
  if (!neighbour) return;
  await prisma.$transaction([
    prisma.amalItem.update({ where: { id: item.id }, data: { order: neighbour.order } }),
    prisma.amalItem.update({ where: { id: neighbour.id }, data: { order: item.order } }),
  ]);
  refreshDashboard();
}

/**
 * Delete only if no member ever recorded it; otherwise switch it off so past
 * Amalnama reports keep their history.
 */
export async function deleteAmalItem(itemId: string): Promise<{ archived: boolean }> {
  const session = await requireUstadhOrAdmin();
  if (!objectId.safeParse(itemId).success) throw actionError(400, "আমল আইটেম ID সঠিক নয়।");
  const item = await requireAmalItem(session, itemId);
  const used = await prisma.dailyAmalEntry.count({ where: { responses: { some: { amalItemId: item.id } } } });
  if (used) {
    await prisma.amalItem.update({ where: { id: item.id }, data: { isActive: false } });
    refreshDashboard();
    return { archived: true };
  }
  await prisma.amalItem.delete({ where: { id: item.id } });
  refreshDashboard();
  return { archived: false };
}

/** Re-apply the default (system) amal list — men / women / Friday. Admin only. */
export async function resyncAmalCatalog() {
  await requireAdmin();
  const result = await syncAmalCatalog(prisma);
  refreshDashboard();
  return result;
}

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "তারিখ সঠিক নয়।");

/** `YYYY-MM-DD` from a date input is a Bangladesh calendar day (00:00 Asia/Dhaka = 18:00 UTC the day before). */
function bangladeshDay(value: string) {
  return new Date(`${value}T00:00:00+06:00`);
}

export async function createCycle(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z
    .object({ title: z.string().trim().min(2, "সাইকেলের নাম লিখুন").max(120), description: z.string().trim().max(1000).optional(), startDate: dateInput, endDate: dateInput })
    .safeParse({ title: formData.get("title"), description: optionalText(formData.get("description")), startDate: formData.get("startDate"), endDate: formData.get("endDate") });
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "সাইকেলের তথ্য সঠিক নয়।");
  const startDate = startOfBangladeshDay(bangladeshDay(parsed.data.startDate));
  const endDate = endOfBangladeshDay(bangladeshDay(parsed.data.endDate));
  if (endDate < startDate) throw actionError(400, "শেষ তারিখ শুরুর তারিখের আগে হতে পারে না।");
  await prisma.cycle.create({
    data: { title: parsed.data.title, description: parsed.data.description ?? null, startDate, endDate, status: CycleStatus.DRAFT, createdById: session.user.id },
  });
  refreshDashboard();
}

export async function changeCycleStatus(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ cycleId: objectId, status: z.enum(CycleStatus) }).safeParse({ cycleId: formData.get("cycleId"), status: formData.get("status") });
  if (!parsed.success) throw actionError(400, "সাইকেলের অবস্থা সঠিক নয়।");
  // Only one cycle may be active: activating one completes the previous active cycle.
  if (parsed.data.status === CycleStatus.ACTIVE)
    await prisma.cycle.updateMany({ where: { status: CycleStatus.ACTIVE, id: { not: parsed.data.cycleId } }, data: { status: CycleStatus.COMPLETED } });
  await prisma.cycle.update({ where: { id: parsed.data.cycleId }, data: { status: parsed.data.status } });
  refreshDashboard();
}

/** Cycle review — written by an Ustadh or an Admin, optionally shown to the member. */
export async function saveReview(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const parsed = z
    .object({ memberId: objectId, cycleId: objectId, comment: z.string().trim().min(3, "রিভিউ অন্তত ৩ অক্ষর").max(3000), isVisibleToMember: z.boolean() })
    .safeParse({ memberId: formData.get("memberId"), cycleId: formData.get("cycleId"), comment: formData.get("comment"), isVisibleToMember: checkbox(formData, "isVisibleToMember") });
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "রিভিউ তথ্য সঠিক নয়।");
  const [member, cycle] = await Promise.all([
    prisma.user.findUnique({ where: { id: parsed.data.memberId }, select: { id: true, hideAmalnama: true } }),
    prisma.cycle.findUnique({ where: { id: parsed.data.cycleId }, select: { id: true } }),
  ]);
  if (!member) throw actionError(404, "সদস্য পাওয়া যায়নি।");
  if (!cycle) throw actionError(404, "সাইকেল পাওয়া যায়নি।");
  if (member.hideAmalnama) throw actionError(403, "সদস্যটি তার আমলনামা লুকিয়ে রেখেছেন — রিভিউ দেওয়া যাচ্ছে না।");
  await prisma.ustadhReview.upsert({
    where: { memberId_cycleId_reviewerId: { memberId: member.id, cycleId: cycle.id, reviewerId: session.user.id } },
    update: { comment: parsed.data.comment, isVisibleToMember: parsed.data.isVisibleToMember },
    create: { ...parsed.data, reviewerId: session.user.id },
  });
  refreshDashboard();
}

/** Reviewer (or Admin) deletes a review. */
export async function deleteReview(reviewId: string) {
  const session = await requireUstadhOrAdmin();
  if (!objectId.safeParse(reviewId).success) throw actionError(400, "রিভিউ ID সঠিক নয়।");
  const review = await prisma.ustadhReview.findUnique({ where: { id: reviewId }, select: { reviewerId: true } });
  if (!review) throw actionError(404, "রিভিউ পাওয়া যায়নি।");
  if (review.reviewerId !== session.user.id && session.user.role !== Role.ADMIN) throw actionError(403, "শুধু রিভিউ লেখক বা অ্যাডমিন মুছতে পারবেন।");
  await prisma.ustadhReview.delete({ where: { id: reviewId } });
  refreshDashboard();
}
