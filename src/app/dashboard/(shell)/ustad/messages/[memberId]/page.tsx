import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "কথোপকথন" };

export default async function UstadThreadPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  if (!/^[a-f\d]{24}$/i.test(memberId)) notFound();
  const member = await prisma.user.findUnique({ where: { id: memberId }, select: { id: true } });
  if (!member) notFound();
  redirect(`/dashboard/ustad/messages?member=${member.id}`);
}
