"use server";

import { Gender, Prisma, Role } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type UserActionResult = { success: boolean; message: string };

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
/** Only পুরুষ / নারী can be assigned. Legacy `OTHER` rows are flagged in the UI so an admin can fix them. */
const assignableGender = z.enum([Gender.MALE, Gender.FEMALE], { message: "লিঙ্গ নির্বাচন করুন — পুরুষ বা নারী।" });
const password = z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।").max(128);

const baseUserSchema = z.object({
  name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে।").max(100),
  email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন।").max(160),
  role: z.enum(Role),
  gender: assignableGender,
  isActive: z.boolean(),
});

function messageFromError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।";
  return error instanceof Error ? error.message : "কাজটি সম্পন্ন করা যায়নি।";
}

function refreshUsers() {
  revalidatePath("/dashboard", "layout");
}

/** At least one active admin must always remain, or nobody could manage the system. */
async function wouldLeaveNoAdmin(userId: string) {
  const others = await prisma.user.count({ where: { role: Role.ADMIN, isActive: true, id: { not: userId } } });
  return others === 0;
}

function readUserForm(formData: FormData) {
  return {
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    gender: formData.get("gender"),
    isActive: formData.get("isActive") === "on",
  };
}

export async function createManagedUser(formData: FormData): Promise<UserActionResult> {
  await requireAdmin();
  const parsed = baseUserSchema.extend({ password }).safeParse({ ...readUserForm(formData), password: formData.get("password") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।" };

  try {
    if (await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } }))
      return { success: false, message: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" };
    const hashed = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, gender: parsed.data.gender, isActive: parsed.data.isActive, emailVerified: true },
      });
      await tx.account.create({ data: { accountId: user.id, providerId: "credential", userId: user.id, password: hashed } });
    });
    refreshUsers();
    return { success: true, message: "নতুন ব্যবহারকারী তৈরি হয়েছে।" };
  } catch (error) {
    return { success: false, message: messageFromError(error) };
  }
}

export async function updateManagedUser(formData: FormData): Promise<UserActionResult> {
  const session = await requireAdmin();
  const parsed = baseUserSchema.extend({ userId: objectId }).safeParse({ ...readUserForm(formData), userId: formData.get("userId") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।" };
  const { userId, ...data } = parsed.data;
  if (userId === session.user.id && (data.role !== Role.ADMIN || !data.isActive))
    return { success: false, message: "নিজের অ্যাডমিন রোল বা সক্রিয় অবস্থা পরিবর্তন করা যাবে না।" };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, isActive: true } });
    if (!user) return { success: false, message: "ব্যবহারকারী পাওয়া যায়নি।" };
    const emailOwner = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } });
    if (emailOwner && emailOwner.id !== userId) return { success: false, message: "এই ইমেইল অন্য একটি অ্যাকাউন্টে ব্যবহৃত হচ্ছে।" };
    const losesAdmin = user.role === Role.ADMIN && user.isActive && (data.role !== Role.ADMIN || !data.isActive);
    if (losesAdmin && (await wouldLeaveNoAdmin(userId))) return { success: false, message: "অন্তত একজন সক্রিয় অ্যাডমিন থাকতে হবে।" };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data });
      // A deactivated account is signed out everywhere immediately.
      if (!data.isActive) await tx.session.deleteMany({ where: { userId } });
    });
    refreshUsers();
    return { success: true, message: "ব্যবহারকারীর তথ্য আপডেট হয়েছে।" };
  } catch (error) {
    return { success: false, message: messageFromError(error) };
  }
}

/** Admin sets a new password; the user is signed out of every device. */
export async function resetManagedUserPassword(formData: FormData): Promise<UserActionResult> {
  await requireAdmin();
  const parsed = z.object({ userId: objectId, password }).safeParse({ userId: formData.get("userId"), password: formData.get("password") });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।" };
  try {
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
    if (!user) return { success: false, message: "ব্যবহারকারী পাওয়া যায়নি।" };
    const hashed = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({ where: { userId: user.id, providerId: "credential" }, select: { id: true } });
      if (account) await tx.account.update({ where: { id: account.id }, data: { password: hashed } });
      else await tx.account.create({ data: { accountId: user.id, providerId: "credential", userId: user.id, password: hashed } });
      await tx.session.deleteMany({ where: { userId: user.id } });
    });
    return { success: true, message: "নতুন পাসওয়ার্ড সেট হয়েছে। ব্যবহারকারীকে নতুন পাসওয়ার্ড দিয়ে আবার লগইন করতে হবে।" };
  } catch (error) {
    return { success: false, message: messageFromError(error) };
  }
}

export async function deleteManagedUser(userId: string): Promise<UserActionResult> {
  const session = await requireAdmin();
  const parsed = objectId.safeParse(userId);
  if (!parsed.success) return { success: false, message: "ব্যবহারকারী ID সঠিক নয়।" };
  if (parsed.data === session.user.id) return { success: false, message: "নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না।" };

  try {
    const user = await prisma.user.findUnique({ where: { id: parsed.data }, select: { id: true, name: true, role: true, isActive: true } });
    if (!user) return { success: false, message: "ব্যবহারকারী পাওয়া যায়নি।" };
    if (user.role === Role.ADMIN && user.isActive && (await wouldLeaveNoAdmin(user.id))) return { success: false, message: "শেষ সক্রিয় অ্যাডমিনকে মুছে ফেলা যাবে না।" };

    await prisma.$transaction(async (tx) => {
      // Cycles and amal items they created stay — ownership moves to the acting admin.
      await tx.cycle.updateMany({ where: { createdById: user.id }, data: { createdById: session.user.id } });
      await tx.amalItem.updateMany({ where: { createdById: user.id }, data: { createdById: session.user.id } });
      await tx.bookReadingLog.deleteMany({ where: { userId: user.id } });
      await tx.book.deleteMany({ where: { userId: user.id } });
      await tx.ustadhReview.deleteMany({ where: { OR: [{ memberId: user.id }, { reviewerId: user.id }] } });
      await tx.amalComment.deleteMany({ where: { OR: [{ memberId: user.id }, { authorId: user.id }] } });
      await tx.announcement.deleteMany({ where: { authorId: user.id } });
      await tx.quranProgress.deleteMany({ where: { userId: user.id } });
      await tx.dailyAmalEntry.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.account.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
    refreshUsers();
    return { success: true, message: `${user.name}-এর অ্যাকাউন্ট মুছে ফেলা হয়েছে।` };
  } catch (error) {
    return { success: false, message: messageFromError(error) };
  }
}
