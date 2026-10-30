import type { AmalAudience, Weekday } from "@prisma/client";

import { isVisibleItem } from "@/lib/amal-audience";

/**
 * The ONE rule for "which amals apply to this member on this day". Every
 * surface (today's form, the save action, the period toggle, grid / list
 * reports, supervisor views) must go through here so scores, maxima and
 * "missed" counts can never disagree with what the member was shown.
 *
 * - audience: ALL + the member's own gender (MALE → তাকবীরে উলা, FEMALE → আউয়াল ওয়াক্ত)
 * - weekday : `specificDay` items (e.g. জুমার আমল) only on that Bangladesh weekday
 * - period  : on a মাসিক day, `exemptOnPeriod` items are not applicable at all
 */
type RuleItem = { genderScope?: AmalAudience | null; specificDay?: Weekday | null; exemptOnPeriod?: boolean | null };

export function isApplicableItem(item: RuleItem, ctx: { gender: unknown; weekday: Weekday | string; isPeriodDay?: boolean }) {
  if (!isVisibleItem(item, ctx.gender)) return false;
  if (item.specificDay && item.specificDay !== ctx.weekday) return false;
  if (ctx.isPeriodDay && item.exemptOnPeriod) return false;
  return true;
}

export function applicableItems<T extends RuleItem>(items: T[], ctx: { gender: unknown; weekday: Weekday | string; isPeriodDay?: boolean }): T[] {
  return items.filter((item) => isApplicableItem(item, ctx));
}
