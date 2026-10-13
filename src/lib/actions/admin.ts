"use server";

import { AmalAudience, AmalCategory, AmalInputType, CycleStatus, Role, Weekday } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin, requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

/** Keep every amal-item surface fresh after a mutation. */
function revalidateAmalItemPages() {
  revalidatePath("/dashboard/amal-items");
  revalidatePath("/dashboard/amal-items/men");
  revalidatePath("/dashboard/amal-items/women");
  revalidatePath("/dashboard/admin/amal-items");
  revalidatePath("/dashboard/amalnama/list");
  revalidatePath("/dashboard/amalnama");
  revalidatePath("/dashboard/amalnama/grid");
}

type AmalItemSession = Awaited<ReturnType<typeof requireUstadhOrAdmin>>;

/**
 * Ownership rule, always re-checked from the database:
 * - ADMIN may modify any amal item.
 * - USTADH may modify only items where `createdById === their id`.
 * - `createdById === null` is the legacy/system default list → ADMIN only.
 */
async function requireAmalItem(session: AmalItemSession, itemId: string) {
  const item = await prisma.amalItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error("আমল আইটেম পাওয়া যায়নি।");
  const isAdmin = (session.user.role as Role) === Role.ADMIN;
  const isOwner = item.createdById !== null && item.createdById === session.user.id;
  if (!isAdmin && !isOwner) throw new Error("এই আমল আইটেম পরিবর্তন করার অনুমতি আপনার নেই।");
  return item;
}

export async function updateMember(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.object({ userId: objectId, operation: z.enum(["toggle", "role"]), role: z.enum(Role).optional() }).safeParse({ userId: formData.get("userId"), operation: formData.get("operation"), role: formData.get("role") || undefined });
  if (!parsed.success) throw new Error("সদস্যের তথ্য সঠিক নয়।");
  if (parsed.data.userId === session.user.id) throw new Error("নিজের admin access পরিবর্তন করা যাবে না।");
  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { isActive: true } });
  if (!user) throw new Error("সদস্য পাওয়া যায়নি।");
  if (parsed.data.operation === "toggle") await prisma.user.update({ where: { id: parsed.data.userId }, data: { isActive: !user.isActive } });
  else await prisma.user.update({ where: { id: parsed.data.userId }, data: { role: parsed.data.role ?? Role.MEMBER } });
  revalidatePath("/dashboard/admin/members");
  revalidatePath("/dashboard/admin");
}

/** Checkbox-style fields: present = on, absent = off. */
const flag = z.coerce.boolean().optional();
const orderField = z.coerce.number().int().min(1).max(9999).optional();

export async function createAmalItem(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const parsed = z.object({ titleBn: z.string().trim().min(2).max(160), description: z.string().trim().max(500).optional(), category: z.enum(AmalCategory), inputType: z.enum(AmalInputType), targetValue: z.coerce.number().min(0).optional(), unit: z.string().trim().max(40).optional(), points: z.coerce.number().positive().max(100), order: orderField, specificDay: z.enum(Weekday).optional(), genderScope: z.enum(AmalAudience).default(AmalAudience.ALL), isActive: flag, isRequired: flag, exemptOnPeriod: flag }).safeParse({ titleBn: formData.get("titleBn"), description: formData.get("description") || undefined, category: formData.get("category"), inputType: formData.get("inputType"), targetValue: formData.get("targetValue") || undefined, unit: formData.get("unit") || undefined, points: formData.get("points"), order: formData.get("order") || undefined, specificDay: formData.get("specificDay") || undefined, genderScope: formData.get("genderScope") || undefined, isActive: formData.get("isActive"), isRequired: formData.get("isRequired"), exemptOnPeriod: formData.get("exemptOnPeriod") });
  if (!parsed.success) throw new Error("আমল আইটেমের তথ্য সঠিক নয়।");
  const { order, isActive, isRequired, exemptOnPeriod, ...data } = parsed.data;
  if (order !== undefined) {
    // Keep the explicit ordering stable: push the tail back by one when needed.
    await prisma.amalItem.updateMany({ where: { order: { gte: order } }, data: { order: { increment: 1 } } });
  }
  const last = await prisma.amalItem.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.amalItem.create({ data: { ...data, order: order ?? (last?.order ?? 0) + 1, isActive: isActive ?? true, isRequired: isRequired ?? false, exemptOnPeriod: exemptOnPeriod ?? false, createdById: session.user.id } });
  revalidateAmalItemPages();
}

export async function updateAmalItem(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const parsed = z.object({ itemId: objectId, operation: z.enum(["toggle", "weight", "edit"]), points: z.coerce.number().positive().max(100).optional(), titleBn: z.string().trim().min(2).max(160).optional(), description: z.string().trim().max(500).optional(), category: z.enum(AmalCategory).optional(), inputType: z.enum(AmalInputType).optional(), targetValue: z.coerce.number().min(0).optional(), unit: z.string().trim().max(40).optional(), specificDay: z.enum(Weekday).optional(), genderScope: z.enum(AmalAudience).optional(), order: orderField, isActive: flag, isRequired: flag, exemptOnPeriod: flag }).safeParse({ itemId: formData.get("itemId"), operation: formData.get("operation"), points: formData.get("points") || undefined, titleBn: formData.get("titleBn") || undefined, description: formData.get("description") || undefined, category: formData.get("category") || undefined, inputType: formData.get("inputType") || undefined, targetValue: formData.get("targetValue") || undefined, unit: formData.get("unit") || undefined, specificDay: formData.get("specificDay") || undefined, genderScope: formData.get("genderScope") || undefined, order: formData.get("order") || undefined, isActive: formData.get("operation") === "edit" ? formData.get("isActive") : undefined, isRequired: formData.get("isRequired"), exemptOnPeriod: formData.get("exemptOnPeriod") });
  if (!parsed.success) throw new Error("আমল আইটেম update করা যায়নি।");
  await requireAmalItem(session, parsed.data.itemId);
  const item = await prisma.amalItem.findUnique({ where: { id: parsed.data.itemId } });
  if (!item) throw new Error("আমল আইটেম পাওয়া যায়নি।");
  if (parsed.data.operation === "toggle") {
    await prisma.amalItem.update({ where: { id: item.id }, data: { isActive: !item.isActive } });
  } else if (parsed.data.operation === "weight") {
    await prisma.amalItem.update({ where: { id: item.id }, data: { points: parsed.data.points ?? item.points } });
  } else {
    const { titleBn, category, inputType, points, genderScope, order, isActive, isRequired, exemptOnPeriod } = parsed.data;
    if (!titleBn || !category || !inputType || points === undefined || !genderScope) throw new Error("আমল আইটেমের তথ্য সঠিক নয়।");
    if (order !== undefined && order !== item.order) await prisma.amalItem.updateMany({ where: { id: { not: item.id }, order: { gte: order } }, data: { order: { increment: 1 } } });
    await prisma.amalItem.update({ where: { id: item.id }, data: { titleBn, category, inputType, points, genderScope, order: order ?? item.order, isActive: isActive ?? item.isActive, isRequired: isRequired ?? item.isRequired, exemptOnPeriod: exemptOnPeriod ?? item.exemptOnPeriod, description: parsed.data.description ?? null, targetValue: parsed.data.targetValue ?? null, unit: parsed.data.unit ?? null, specificDay: parsed.data.specificDay ?? null } });
  }
  revalidateAmalItemPages();
}

export async function deleteAmalItem(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const parsed = z.object({ itemId: objectId }).safeParse({ itemId: formData.get("itemId") });
  if (!parsed.success) throw new Error("আমল আইটেমের তথ্য সঠিক নয়।");
  const item = await requireAmalItem(session, parsed.data.itemId);
  await prisma.amalItem.delete({ where: { id: item.id } });
  revalidateAmalItemPages();
}

export async function createCycle(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).optional(), startDate: z.coerce.date(), endDate: z.coerce.date() }).safeParse({ title: formData.get("title"), description: formData.get("description") || undefined, startDate: formData.get("startDate"), endDate: formData.get("endDate") });
  if (!parsed.success || parsed.data.endDate < parsed.data.startDate) throw new Error("সাইকেলের তারিখ সঠিক নয়।");
  await prisma.cycle.create({ data: { ...parsed.data, createdById: session.user.id } });
  revalidatePath("/dashboard/admin/cycles");
}

export async function changeCycleStatus(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ cycleId: objectId, status: z.enum(CycleStatus) }).safeParse({ cycleId: formData.get("cycleId"), status: formData.get("status") });
  if (!parsed.success) throw new Error("সাইকেল status সঠিক নয়।");
  if (parsed.data.status === CycleStatus.ACTIVE) await prisma.cycle.updateMany({ where: { status: CycleStatus.ACTIVE, id: { not: parsed.data.cycleId } }, data: { status: CycleStatus.COMPLETED } });
  await prisma.cycle.update({ where: { id: parsed.data.cycleId }, data: { status: parsed.data.status } });
  revalidatePath("/dashboard", "layout");
}

export async function saveReview(formData: FormData) {
  const session = await requireAdmin();
  const parsed = z.object({ memberId: objectId, cycleId: objectId, comment: z.string().trim().min(3).max(3000), isVisibleToMember: z.coerce.boolean() }).safeParse({ memberId: formData.get("memberId"), cycleId: formData.get("cycleId"), comment: formData.get("comment"), isVisibleToMember: formData.get("isVisibleToMember") === "on" });
  if (!parsed.success) throw new Error("রিভিউ তথ্য সঠিক নয়।");
  const member = await prisma.user.findUnique({ where: { id: parsed.data.memberId }, select: { id: true, hideAmalnama: true } });
  if (!member) throw new Error("সদস্য পাওয়া যায়নি।");
  if (member.hideAmalnama) throw new Error("সদস্যটি তার আমলনামা লুকিয়ে রেখেছেন — রিভিউ দেওয়া যাচ্ছে না।");
  await prisma.ustadhReview.upsert({ where: { memberId_cycleId_reviewerId: { memberId: parsed.data.memberId, cycleId: parsed.data.cycleId, reviewerId: session.user.id } }, update: { comment: parsed.data.comment, isVisibleToMember: parsed.data.isVisibleToMember }, create: { ...parsed.data, reviewerId: session.user.id } });
  revalidatePath("/dashboard/admin/reviews");
  revalidatePath("/dashboard/reviews");
}