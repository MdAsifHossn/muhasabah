"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * A member hides/shows their own Amalnama. There is deliberately no target id:
 * you can only ever flip your own flag — an admin may NOT hide (or unhide)
 * somebody else's Amalnama from here.
 */
export async function setHideAmalnama(hidden: boolean) {
  if (typeof hidden !== "boolean") throw new Error("প্রাইভেসি তথ্য সঠিক নয়।");
  const session = await requireUser();
  await prisma.user.update({ where: { id: session.user.id }, data: { hideAmalnama: hidden } });

  // Every surface that renders somebody else's Amalnama-derived data.
  revalidatePath("/dashboard/amalnama/list");
  revalidatePath("/dashboard/leaderboard");
  revalidatePath("/dashboard/admin/reviews");
  revalidatePath("/dashboard/admin/members");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard", "layout");
}
