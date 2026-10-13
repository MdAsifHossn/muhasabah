import { AmalAudience, type AmalItem } from "@prisma/client";

import type { AmalItemView, AmalItemsPageKey } from "@/components/amal-items/amal-item-view";
import { AMAL_ITEMS_PAGES } from "@/components/amal-items/amal-item-view";
import { prisma } from "@/lib/prisma";

/** A full Prisma `AmalItem` row (all three pages read the same columns). */
type AmalItemRow = AmalItem;

export function toAmalItemView(item: AmalItemRow): AmalItemView {
  return {
    id: item.id,
    titleBn: item.titleBn,
    titleEn: item.titleEn,
    description: item.description,
    category: item.category,
    inputType: item.inputType,
    targetValue: item.targetValue,
    unit: item.unit,
    points: item.points,
    order: item.order,
    isActive: item.isActive,
    isRequired: item.isRequired,
    exemptOnPeriod: item.exemptOnPeriod,
    genderScope: item.genderScope,
    specificDay: item.specificDay,
    createdById: item.createdById,
  };
}

/**
 * Items visible on one of the three management pages:
 * `men` → ALL+MALE, `women` → ALL+FEMALE, `all` → everything.
 */
export async function loadAmalItemsForPage(page: AmalItemsPageKey): Promise<AmalItemView[]> {
  const scopes = AMAL_ITEMS_PAGES[page].visibleScopes;
  const items = await prisma.amalItem.findMany({
    where: scopes ? { genderScope: { in: scopes as AmalAudience[] } } : undefined,
    orderBy: { order: "asc" },
  });
  return items.map(toAmalItemView);
}
