"use server";

import { AmalAudience, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError } from "@/lib/action-error";
import { requireUstadhOrAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const noticeSchema = z.object({
  title: z.string().trim().min(2, "শিরোনাম অন্তত ২ অক্ষর").max(140),
  body: z.string().trim().min(2, "বিস্তারিত লিখুন").max(4000),
  audience: z.enum(AmalAudience).default(AmalAudience.ALL),
  pinned: z.boolean(),
});

function refresh() {
  revalidatePath("/dashboard", "layout");
}

/** Ustadh / Admin posts a notice for everyone, only brothers, or only sisters. */
export async function createNotice(formData: FormData) {
  const session = await requireUstadhOrAdmin();
  const parsed = noticeSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    audience: formData.get("audience") || undefined,
    pinned: formData.get("pinned") === "on",
  });
  if (!parsed.success) throw actionError(400, parsed.error.issues[0]?.message ?? "নোটিশের তথ্য সঠিক নয়।");
  await prisma.announcement.create({ data: { ...parsed.data, authorId: session.user.id } });
  refresh();
}

/** Author or Admin may pin/unpin or delete. */
async function requireOwnNotice(id: string) {
  const session = await requireUstadhOrAdmin();
  if (!/^[a-f\d]{24}$/i.test(id)) throw actionError(400, "নোটিশ ID সঠিক নয়।");
  const notice = await prisma.announcement.findUnique({ where: { id }, select: { id: true, authorId: true, pinned: true } });
  if (!notice) throw actionError(404, "নোটিশটি পাওয়া যায়নি।");
  if (notice.authorId !== session.user.id && session.user.role !== Role.ADMIN) throw actionError(403, "শুধু লেখক বা অ্যাডমিন এটি পরিবর্তন করতে পারবেন।");
  return notice;
}

export async function toggleNoticePin(id: string) {
  const notice = await requireOwnNotice(id);
  await prisma.announcement.update({ where: { id: notice.id }, data: { pinned: !notice.pinned } });
  refresh();
}

export async function deleteNotice(id: string) {
  const notice = await requireOwnNotice(id);
  await prisma.announcement.delete({ where: { id: notice.id } });
  refresh();
}
