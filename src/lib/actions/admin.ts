"use server";

import { AmalAudience, AmalCategory, AmalInputType, Weekday } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { syncAmalCatalog } from "../../../prisma/amal-catalog";
import { actionError } from "@/lib/action-error";
import { getStorageCycle } from "@/lib/cycles";
import { isAdminRole, requireAdmin, requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

/** Any amal-item / cycle / review change touches the whole dashboard (forms, reports, panels). */
function refreshDashboard() {
  revalidatePath("/dashboard", "layout");
}

type StaffSession = Awaited<ReturnType<typeof requireUstadhOrAdmin>>;

/**
 * Ownership rule, always re-checked from the database:
 * - USTADH / ADMIN may modify all items (custom and system default list).
 */
async function requireAmalItem(session: StaffSession, itemId: string) {
  const item = await prisma.amalItem.findUnique({ where: { id: itemId } });
  if (!item) throw actionError(404, "আমল আইটেম পাওয়া যায়নি।");
  const isAdmin = isAdminRole(session.user.role);
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

/** Cycle review — written by an Ustadh or an Admin, optionally shown to the member. */
export async function saveReview(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const parsed = z
    .object({ memberId: objectId, cycleId: objectId.optional(), comment: z.string().trim().min(3, "রিভিউ অন্তত ৩ অক্ষর").max(3000), isVisibleToMember: z.boolean() })
    .safeParse({ memberId: formData.get("memberId"), cycleId: formData.get("cycleId") || undefined, comment: formData.get("comment"), isVisibleToMember: checkbox(formData, "isVisibleToMember") });
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "রিভিউ তথ্য সঠিক নয়।");
  const member = await prisma.user.findUnique({ where: { id: parsed.data.memberId }, select: { id: true, hideAmalnama: true } });
  if (!member) throw actionError(404, "সদস্য পাওয়া যায়নি।");
  if (member.hideAmalnama) throw actionError(403, "সদস্যটি তার আমলনামা লুকিয়ে রেখেছেন — রিভিউ দেওয়া যাচ্ছে না।");
  const data = { comment: parsed.data.comment, isVisibleToMember: parsed.data.isVisibleToMember };
  // No more cycles to choose: a reviewer keeps one running review per member (the latest one is edited).
  const existing = await prisma.ustadhReview.findFirst({
    where: { memberId: member.id, reviewerId: session.user.id, ...(parsed.data.cycleId ? { cycleId: parsed.data.cycleId } : {}) },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (existing) await prisma.ustadhReview.update({ where: { id: existing.id }, data });
  else {
    const cycle = await getStorageCycle(session.user.id);
    await prisma.ustadhReview.create({ data: { ...data, memberId: member.id, cycleId: cycle.id, reviewerId: session.user.id } });
  }
  refreshDashboard();
}

/** Reviewer (or Admin) deletes a review. */
export async function deleteReview(reviewId: string) {
  const session = await requireUstadhOrAdmin();
  if (!objectId.safeParse(reviewId).success) throw actionError(400, "রিভিউ ID সঠিক নয়।");
  const review = await prisma.ustadhReview.findUnique({ where: { id: reviewId }, select: { reviewerId: true } });
  if (!review) throw actionError(404, "রিভিউ পাওয়া যায়নি।");
  if (review.reviewerId !== session.user.id && !isAdminRole(session.user.role)) throw actionError(403, "শুধু রিভিউ লেখক বা উস্তাদজি মুছতে পারবেন।");
  await prisma.ustadhReview.delete({ where: { id: reviewId } });
  refreshDashboard();
}
