import { Role } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.user.isActive) redirect("/?auth=login");
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
