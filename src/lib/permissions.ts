import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * Two active roles:
 * - MEMBER: নিজের আমলনামা, কুরআন, হাদীস, বই ও প্রোফাইল।
 * - USTADH: সদস্যের সব সুবিধার সঙ্গে পুরো সিস্টেমের একমাত্র administrator
 *   — সদস্য, রোল, পাসওয়ার্ড, সাইকেল, আমল, নোটিশ ও রিভিউ নিয়ন্ত্রণ করেন।
 *
 * ADMIN is kept only as a legacy database value so existing deployments can
 * be migrated safely. It is never granted access or offered in the UI.
 */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.user.isActive) redirect("/login");
  return session;
}

export async function requireRole(allowedRoles: readonly Role[]) {
  const session = await requireUser();
  if (!allowedRoles.includes(session.user.role as Role)) redirect("/dashboard");
  return session;
}

export function requireAdmin() {
  return requireRole([Role.USTADH]);
}

export function requireUstadhOrAdmin() {
  return requireRole([Role.USTADH]);
}

export function isStaffRole(role: unknown): boolean {
  return role === Role.USTADH;
}

export function isAdminRole(role: unknown): boolean {
  // Kept as a compatibility helper for existing callers. Ustadhji is the
  // only administrator now.
  return role === Role.USTADH;
}
