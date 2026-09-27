"use server";

import { AmalCategory, AmalInputType, CycleStatus, Role, Weekday } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

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

export async function createAmalItem(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ titleBn: z.string().trim().min(2).max(160), category: z.enum(AmalCategory), inputType: z.enum(AmalInputType), targetValue: z.coerce.number().min(0).optional(), unit: z.string().trim().max(40).optional(), points: z.coerce.number().positive().max(100), specificDay: z.enum(Weekday).optional() }).safeParse({ titleBn: formData.get("titleBn"), category: formData.get("category"), inputType: formData.get("inputType"), targetValue: formData.get("targetValue") || undefined, unit: formData.get("unit") || undefined, points: formData.get("points"), specificDay: formData.get("specificDay") || undefined });
  if (!parsed.success) throw new Error("আমল আইটেমের তথ্য সঠিক নয়।");
  const last = await prisma.amalItem.findFirst({ orderBy: { order: "desc" }, select: { order: true } });
  await prisma.amalItem.create({ data: { ...parsed.data, order: (last?.order ?? 0) + 1 } });
  revalidatePath("/dashboard/admin/amal-items");
  revalidatePath("/dashboard/amalnama");
}

export async function updateAmalItem(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({ itemId: objectId, operation: z.enum(["toggle", "weight"]), points: z.coerce.number().positive().max(100).optional() }).safeParse({ itemId: formData.get("itemId"), operation: formData.get("operation"), points: formData.get("points") || undefined });
  if (!parsed.success) throw new Error("আমল আইটেম update করা যায়নি।");
  const item = await prisma.amalItem.findUnique({ where: { id: parsed.data.itemId } });
  if (!item) throw new Error("আমল আইটেম পাওয়া যায়নি।");
  await prisma.amalItem.update({ where: { id: item.id }, data: parsed.data.operation === "toggle" ? { isActive: !item.isActive } : { points: parsed.data.points ?? item.points } });
  revalidatePath("/dashboard/admin/amal-items");
  revalidatePath("/dashboard/amalnama");
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
  await prisma.ustadhReview.upsert({ where: { memberId_cycleId_reviewerId: { memberId: parsed.data.memberId, cycleId: parsed.data.cycleId, reviewerId: session.user.id } }, update: { comment: parsed.data.comment, isVisibleToMember: parsed.data.isVisibleToMember }, create: { ...parsed.data, reviewerId: session.user.id } });
  revalidatePath("/dashboard/admin/reviews");
  revalidatePath("/dashboard/reviews");
}