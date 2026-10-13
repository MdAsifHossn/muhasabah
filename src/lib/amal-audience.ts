import { AmalAudience, Gender } from "@prisma/client";

/**
 * Gender → Amalnama audience plumbing (Requirement: women's amals stay separate).
 *
 * Rules:
 * - MALE member   → sees items scoped ALL or MALE
 * - FEMALE member → sees items scoped ALL or FEMALE
 * - OTHER/legacy  → sees items scoped ALL only
 *
 * This module is intentionally free of any Prisma runtime import so client
 * components (the sign-up form, the amal-item manager) can share it safely.
 */

export const genderLabels: Record<Gender, string> = { MALE: "পুরুষ", FEMALE: "নারী", OTHER: "অন্যান্য" };

export const audienceLabels: Record<AmalAudience, string> = { ALL: "সবার", MALE: "পুরুষ", FEMALE: "নারী" };

/** Anything that is not a known enum value degrades to OTHER (legacy rows included). */
export function normalizeGender(value: unknown): Gender {
  if (value === Gender.MALE || value === Gender.FEMALE || value === Gender.OTHER) return value;
  return Gender.OTHER;
}

/** The item audiences a member with this gender may be shown / scored against. */
export function visibleAudiences(value: unknown): AmalAudience[] {
  const gender = normalizeGender(value);
  if (gender === Gender.MALE) return [AmalAudience.ALL, AmalAudience.MALE];
  if (gender === Gender.FEMALE) return [AmalAudience.ALL, AmalAudience.FEMALE];
  return [AmalAudience.ALL];
}

export function normalizeAudience(value: unknown): AmalAudience {
  if (value === AmalAudience.ALL || value === AmalAudience.MALE || value === AmalAudience.FEMALE) return value;
  return AmalAudience.ALL;
}

type MaybeAudience = { genderScope?: AmalAudience | null };

/** `null`/unknown scope is treated as ALL (legacy rows predate the column). */
export function isVisibleItem(item: MaybeAudience, gender: unknown): boolean {
  const scope = item.genderScope ?? AmalAudience.ALL;
  return visibleAudiences(gender).includes(scope);
}

export function filterVisibleItems<T extends MaybeAudience>(items: T[], gender: unknown): T[] {
  return items.filter((item) => isVisibleItem(item, gender));
}

/**
 * Ids of the items the member may be scored against — stored `DailyAmalEntry.responses`
 * rows outside this set (deleted items, or rows written before a gender change)
 * must never be rendered or counted.
 */
export function visibleItemIdSet<T extends MaybeAudience & { id: string }>(items: T[], gender: unknown): Set<string> {
  return new Set(filterVisibleItems(items, gender).map((item) => item.id));
}
