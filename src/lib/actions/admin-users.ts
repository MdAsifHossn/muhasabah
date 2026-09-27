"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function approveUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
  });
  revalidatePath("/dashboard/admin");
}

export async function rejectUser(userId: string) {
  await requireAdmin();
  // Delete their sessions and accounts first, then the user
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/admin");
}

export async function deleteUser(userId: string) {
  await requireAdmin();
  // Delete everything associated with the user
  await prisma.bookReadingLog.deleteMany({ where: { userId } });
  await prisma.book.deleteMany({ where: { userId } });
  await prisma.ustadhReview.deleteMany({ where: { memberId: userId } });
  await prisma.ustadhReview.deleteMany({ where: { reviewerId: userId } });
  await prisma.dailyAmalEntry.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/admin");
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
  revalidatePath("/dashboard/admin");
}

export async function changeUserRole(userId: string, role: "MEMBER" | "USTADH" | "ADMIN") {
  await requireAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  revalidatePath("/dashboard/admin");
}
