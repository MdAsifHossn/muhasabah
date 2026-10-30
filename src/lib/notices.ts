import { AmalAudience, Gender } from "@prisma/client";

import { visibleAudiences } from "@/lib/amal-audience";
import { isStaffRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/**
 * Notices a user may read: staff see every notice; members see ALL + their
 * own gender's notices. Pinned first, newest next.
 */
export async function getNoticesFor(user: { role: unknown; gender?: Gender | null }, take = 30) {
  const audiences = isStaffRole(user.role) ? [AmalAudience.ALL, AmalAudience.MALE, AmalAudience.FEMALE] : visibleAudiences(user.gender ?? Gender.OTHER);
  return prisma.announcement.findMany({
    where: { audience: { in: audiences } },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take,
    include: { author: { select: { name: true, role: true } } },
  });
}
