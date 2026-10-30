import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

/**
 * Three roles:
 * - MEMBER (সাধারণ ব্যবহারকারী): own Amalnama, Quran, Hadith, books, profile.
 * - USTADH (উস্তাদজি): everything a member has + supervises members — reads
 *   their Amalnama (unless hidden), comments, writes cycle reviews, manages
 *   amal items they created, posts notices.
 * - ADMIN: everything an Ustadh has + users, roles, passwords, cycles and the
 *   system default amal list.
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
  return requireRole([Role.ADMIN]);
}

export function requireUstadhOrAdmin() {
  return requireRole([Role.USTADH, Role.ADMIN]);
}

export function isStaffRole(role: unknown): boolean {
  return role === Role.USTADH || role === Role.ADMIN;
}

export function isAdminRole(role: unknown): boolean {
  return role === Role.ADMIN;
}
