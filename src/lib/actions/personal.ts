"use server";

import { BookStatus, Gender } from "@prisma/client";
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
