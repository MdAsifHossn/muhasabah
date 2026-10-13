"use server";

import { Gender, Prisma, Role } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type UserActionResult = { success: boolean; message: string };

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
/**
 * Only পুরুষ / নারী can be assigned. Legacy rows may still carry `OTHER`
 * (an unset gender) — those members only see the general amals and are
 * flagged in the members table so an admin can set the real gender here.
 */
const assignableGender = z.enum([Gender.MALE, Gender.FEMALE], { message: "লিঙ্গ নির্বাচন করুন — পুরুষ বা নারী।" });

const baseUserSchema = z.object({
  name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে।").max(100),
  email: z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন।").max(160),
  role: z.enum(Role),
  gender: assignableGender,
  isActive: z.boolean(),
});

function messageFromError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।";
  }
  return error instanceof Error ? error.message : "কাজটি সম্পন্ন করা যায়নি।";
}

function refreshUsers() {
  revalidatePath("/dashboard/admin/members");
  revalidatePath("/dashboard/admin");
}

export async function createManagedUser(formData: FormData): Promise<UserActionResult> {
  await requireAdmin();
  const parsed = baseUserSchema.extend({
    password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।").max(128),
  }).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    gender: formData.get("gender"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।" };

  try {
    const password = await hashPassword(parsed.data.password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          gender: parsed.data.gender,
          isActive: parsed.data.isActive,
          emailVerified: true,
        },
      });
      await tx.account.create({
        data: {
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password,
        },
      });
    });
    refreshUsers();
    return { success: true, message: "নতুন ব্যবহারকারী তৈরি হয়েছে।" };
  } catch (error) {
    return { success: false, message: messageFromError(error) };
  }
}

export async function updateManagedUser(formData: FormData): Promise<UserActionResult> {
  const session = await requireAdmin();
  const parsed = baseUserSchema.extend({
    userId: objectId,
    password: z.string().max(128).optional(),
  }).safeParse({
    userId: formData.get("userId"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: String(formData.get("password") ?? "").trim() || undefined,
    role: formData.get("role"),
    gender: formData.get("gender"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? "তথ্য সঠিক নয়।" };
  if (parsed.data.password && parsed.data.password.length < 8) {
    return { success: false, message: "নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।" };
  }
  if (parsed.data.userId === session.user.id && (parsed.data.role !== Role.ADMIN || !parsed.data.isActive)) {
    return { success: false, message: "নিজের admin role বা active status পরিবর্তন করা যাবে না।" };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { id: true } });
    if (!user) return { success: false, message: "ব্যবহারকারী পাওয়া যায়নি।" };

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: parsed.data.userId },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          gender: parsed.data.gender,
          isActive: parsed.data.isActive,
        },
      });
      if (parsed.data.password) {
        const password = await hashPassword(parsed.data.password);
        await tx.account.upsert({
          where: { providerId_accountId: { providerId: "credential", accountId: parsed.data.userId } },
          update: { password },
          create: {
            accountId: parsed.data.userId,
            providerId: "credential",
            userId: parsed.data.userId,
            password,
          },
        });
        await tx.session.deleteMany({ where: { userId: parsed.data.userId } });
      }
    });
    refreshUsers();
    return { success: true, message: "ব্যবহারকারীর তথ্য আপডেট হয়েছে।" };
  } catch (error) {
    return { success: false, message: messageFromError(error) };
  }
}

export async function deleteManagedUser(userId: string): Promise<UserActionResult> {
  const session = await requireAdmin();
  const parsed = objectId.safeParse(userId);
  if (!parsed.success) return { success: false, message: "ব্যবহারকারী ID সঠিক নয়।" };
  if (parsed.data === session.user.id) return { success: false, message: "নিজের admin account delete করা যাবে না।" };

  try {
    const user = await prisma.user.findUnique({ where: { id: parsed.data }, select: { id: true, name: true } });
    if (!user) return { success: false, message: "ব্যবহারকারী পাওয়া যায়নি।" };

    await prisma.$transaction(async (tx) => {
      await tx.cycle.updateMany({ where: { createdById: user.id }, data: { createdById: session.user.id } });
      await tx.bookReadingLog.deleteMany({ where: { userId: user.id } });
      await tx.book.deleteMany({ where: { userId: user.id } });
      await tx.ustadhReview.deleteMany({ where: { OR: [{ memberId: user.id }, { reviewerId: user.id }] } });
      await tx.dailyAmalEntry.deleteMany({ where: { userId: user.id } });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.account.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    });
    refreshUsers();
    return { success: true, message: `${user.name}-এর অ্যাকাউন্ট delete হয়েছে।` };
  } catch (error) {
    return { success: false, message: messageFromError(error) };
  }
}

// Kept for the admin approval overview.
export async function approveUser(userId: string) {
  const session = await requireAdmin();
  if (userId === session.user.id) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  refreshUsers();
}

export async function rejectUser(userId: string) {
  return deleteManagedUser(userId);
}