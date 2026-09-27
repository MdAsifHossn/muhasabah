"use server";

import { BookStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getBangladeshToday } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

export async function updateProfile(formData: FormData) {
  const session = await requireUser();
  const parsed = z.object({ name: z.string().trim().min(2).max(100) }).safeParse({ name: formData.get("name") });
  if (!parsed.success) throw new Error("নাম সঠিক নয়।");
  await prisma.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name } });
  revalidatePath("/dashboard", "layout");
}

export async function createBook(formData: FormData) {
  const session = await requireUser();
  const parsed = z.object({ title: z.string().trim().min(2).max(180), author: z.string().trim().max(120).optional(), publisher: z.string().trim().max(120).optional(), totalPages: z.coerce.number().int().positive().max(100000).optional(), status: z.enum(BookStatus) }).safeParse({ title: formData.get("title"), author: formData.get("author") || undefined, publisher: formData.get("publisher") || undefined, totalPages: formData.get("totalPages") || undefined, status: formData.get("status") });
  if (!parsed.success) throw new Error("বইয়ের তথ্য সঠিক নয়।");
  await prisma.book.create({ data: { ...parsed.data, userId: session.user.id } });
  revalidatePath("/dashboard/books");
}

export async function addReadingLog(formData: FormData) {
  const session = await requireUser();
  const parsed = z.object({ bookId: objectId, pagesRead: z.coerce.number().int().positive().max(10000), fromPage: z.coerce.number().int().positive().optional(), toPage: z.coerce.number().int().positive().optional(), note: z.string().trim().max(500).optional() }).safeParse({ bookId: formData.get("bookId"), pagesRead: formData.get("pagesRead"), fromPage: formData.get("fromPage") || undefined, toPage: formData.get("toPage") || undefined, note: formData.get("note") || undefined });
  if (!parsed.success) throw new Error("পাঠের তথ্য সঠিক নয়।");
  const book = await prisma.book.findFirst({ where: { id: parsed.data.bookId, userId: session.user.id } });
  if (!book) throw new Error("বই পাওয়া যায়নি।");
  await prisma.bookReadingLog.create({ data: { ...parsed.data, userId: session.user.id, date: getBangladeshToday() } });
  if (book.status === BookStatus.PLANNED) await prisma.book.update({ where: { id: book.id }, data: { status: BookStatus.READING } });
  revalidatePath("/dashboard/books");
}