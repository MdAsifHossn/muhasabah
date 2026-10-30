import { Gender, Weekday } from "@prisma/client";

import type { AmalItemView, AmalPreview } from "@/components/amal-items/amal-item-view";
import { applicableItems } from "@/lib/amal-rules";
import { weekdayLabels } from "@/lib/constants";
import { getBangladeshWeekday } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

/** Every amal item (the manager filters by tab on the client) + the per-gender preview. */
export async function loadAmalItems(): Promise<{ items: AmalItemView[]; preview: AmalPreview }> {
  const rows = await prisma.amalItem.findMany({ orderBy: { order: "asc" } });
  const creatorIds = [...new Set(rows.map((row) => row.createdById).filter((id): id is string => Boolean(id)))];
  const creators = creatorIds.length ? await prisma.user.findMany({ where: { id: { in: creatorIds } }, select: { id: true, name: true } }) : [];
  const creatorName = new Map(creators.map((creator) => [creator.id, creator.name]));

  const items: AmalItemView[] = rows.map((item) => ({
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
    creatorName: item.createdById ? (creatorName.get(item.createdById) ?? null) : null,
  }));

  const active = rows.filter((row) => row.isActive);
  const weekday = getBangladeshWeekday();
  const forGender = (gender: Gender) => {
    const today = applicableItems(active, { gender, weekday });
    return {
      today: today.length,
      friday: applicableItems(active, { gender, weekday: Weekday.FRIDAY }).length,
      points: today.reduce((sum, item) => sum + item.points, 0),
    };
  };

  return {
    items,
    preview: {
      todayLabel: weekdayLabels[weekday],
      isFriday: weekday === Weekday.FRIDAY,
      male: forGender(Gender.MALE),
      female: forGender(Gender.FEMALE),
    },
  };
}
