"use server";

import { BookStatus, Gender, Prisma } from "@prisma/client";
import { verifyPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError } from "@/lib/action-error";
import { getBangladeshToday } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export async function updateProfile(formData: FormData) {
  const session = await requireUser();
  const parsed = z.object({ name: z.string().trim().min(2).max(100) }).safeParse({ name: formData.get("name") });
  if (!parsed.success) throw actionError(400, "নাম কমপক্ষে ২ অক্ষরের হতে হবে।");
  await prisma.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name } });
  revalidatePath("/dashboard", "layout");
}

export type EmailChangeResult = { success: boolean; message: string };

/**
 * Own email change. The current password is required, so a stolen session alone cannot take the account over.
 * (There is no mail server, so the new address is not verified — it is simply the new login.)
 */
export async function changeOwnEmail(input: { email: string; currentPassword: string }): Promise<EmailChangeResult> {
  const session = await requireUser();
  const email = z.string().trim().toLowerCase().email("সঠিক ইমেইল দিন।").max(160).safeParse(input.email);
  if (!email.success) return { success: false, message: email.error.issues[0]?.message ?? "সঠিক ইমেইল দিন।" };
  if (!input.currentPassword) return { success: false, message: "বর্তমান পাসওয়ার্ড দিন।" };

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } });
  if (!user) return { success: false, message: "অ্যাকাউন্ট পাওয়া যায়নি।" };
  if (user.email.toLowerCase() === email.data) return { success: false, message: "এটি আপনার বর্তমান ইমেইলই।" };

  const account = await prisma.account.findFirst({ where: { userId: session.user.id, providerId: "credential" }, select: { password: true } });
  if (!account?.password || !(await verifyPassword({ hash: account.password, password: input.currentPassword }))) return { success: false, message: "বর্তমান পাসওয়ার্ড সঠিক নয়।" };

  try {
    const taken = await prisma.user.findUnique({ where: { email: email.data }, select: { id: true } });
    if (taken) return { success: false, message: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" };
    await prisma.user.update({ where: { id: session.user.id }, data: { email: email.data } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false, message: "এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।" };
    return { success: false, message: "ইমেইল পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।" };
  }
  revalidatePath("/dashboard", "layout");
  return { success: true, message: "ইমেইল পরিবর্তন হয়েছে। এখন থেকে নতুন ইমেইল দিয়ে লগইন করবেন।" };
}

/**
 * A member whose gender was never set (legacy `OTHER`) picks it once. After
 * that only an admin can change it, because it decides which amals are scored.
 */
export async function setOwnGender(formData: FormData) {
  const session = await requireUser();
  const parsed = z.enum([Gender.MALE, Gender.FEMALE]).safeParse(formData.get("gender"));
  if (!parsed.success) throw actionError(400, "পুরুষ বা নারী নির্বাচন করুন।");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { gender: true } });
  if (user?.gender !== Gender.OTHER) throw actionError(403, "লিঙ্গ একবার নির্ধারণের পর শুধু উস্তাদজি পরিবর্তন করতে পারবেন।");
  await prisma.user.update({ where: { id: session.user.id }, data: { gender: parsed.data } });
  revalidatePath("/dashboard", "layout");
}

export async function createBook(formData: FormData) {
  const session = await requireUser();
  const parsed = z
    .object({
      title: z.string().trim().min(2).max(180),
      author: z.string().trim().max(120).optional(),
      publisher: z.string().trim().max(120).optional(),
      totalPages: z.coerce.number().int().positive().max(100000).optional(),
      status: z.enum(BookStatus),
    })
    .safeParse({ title: formData.get("title"), author: formData.get("author") || undefined, publisher: formData.get("publisher") || undefined, totalPages: formData.get("totalPages") || undefined, status: formData.get("status") });
  if (!parsed.success) throw actionError(400, "বইয়ের তথ্য সঠিক নয়।");
  await prisma.book.create({ data: { ...parsed.data, userId: session.user.id } });
  revalidatePath("/dashboard/books");
}

export async function updateBookStatus(formData: FormData) {
  const session = await requireUser();
  const parsed = z.object({ bookId: objectId, status: z.enum(BookStatus) }).safeParse({ bookId: formData.get("bookId"), status: formData.get("status") });
  if (!parsed.success) throw actionError(400, "তথ্য সঠিক নয়।");
  const result = await prisma.book.updateMany({ where: { id: parsed.data.bookId, userId: session.user.id }, data: { status: parsed.data.status } });
  if (!result.count) throw actionError(404, "বই পাওয়া যায়নি।");
  revalidatePath("/dashboard/books");
}

export async function deleteBook(formData: FormData) {
  const session = await requireUser();
  const parsed = objectId.safeParse(formData.get("bookId"));
  if (!parsed.success) throw actionError(400, "তথ্য সঠিক নয়।");
  const book = await prisma.book.findFirst({ where: { id: parsed.data, userId: session.user.id }, select: { id: true } });
  if (!book) throw actionError(404, "বই পাওয়া যায়নি।");
  await prisma.bookReadingLog.deleteMany({ where: { bookId: book.id } });
  await prisma.book.delete({ where: { id: book.id } });
  revalidatePath("/dashboard/books");
}

export async function addReadingLog(formData: FormData) {
  const session = await requireUser();
  const parsed = z
    .object({
      bookId: objectId,
      pagesRead: z.coerce.number().int().positive().max(10000),
      fromPage: z.coerce.number().int().positive().optional(),
      toPage: z.coerce.number().int().positive().optional(),
      note: z.string().trim().max(500).optional(),
    })
    .safeParse({ bookId: formData.get("bookId"), pagesRead: formData.get("pagesRead"), fromPage: formData.get("fromPage") || undefined, toPage: formData.get("toPage") || undefined, note: formData.get("note") || undefined });
  if (!parsed.success) throw actionError(400, "পাঠের তথ্য সঠিক নয়।");
  if (parsed.data.fromPage && parsed.data.toPage && parsed.data.toPage < parsed.data.fromPage) throw actionError(400, "শেষ পৃষ্ঠা শুরুর পৃষ্ঠার আগে হতে পারে না।");
  const book = await prisma.book.findFirst({ where: { id: parsed.data.bookId, userId: session.user.id } });
  if (!book) throw actionError(404, "বই পাওয়া যায়নি।");
  await prisma.bookReadingLog.create({ data: { ...parsed.data, userId: session.user.id, date: getBangladeshToday() } });
  if (book.status === BookStatus.PLANNED) await prisma.book.update({ where: { id: book.id }, data: { status: BookStatus.READING } });
  revalidatePath("/dashboard/books");
}
