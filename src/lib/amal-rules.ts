import type { AmalAudience, Weekday } from "@prisma/client";

import { isVisibleItem } from "@/lib/amal-audience";
import { bangladeshDateKey } from "@/lib/dates";
import { naflFastingReason } from "@/lib/hijri";

/**
 * The ONE rule for "which amals apply to this member on this day". Every
 * surface (today's form, the save action, the period toggle, grid / list
 * reports, supervisor views) must go through here so scores, maxima and
 * "missed" counts can never disagree with what the member was shown.
 *
 * - audience: ALL + the member's own gender (MALE → তাকবীরে উলা, FEMALE → আউয়াল ওয়াক্ত)
 * - weekday : `specificDay` items (e.g. জুমার আমল) only on that Bangladesh weekday
 * - নফল রোজা: only on a sunnah fasting day (সোম/বৃহস্পতি, আরাফা, আশুরা, আইয়ামে বীজ …)
 * - period  : on a মাসিক day, `exemptOnPeriod` items are not applicable at all
 */
type RuleItem = { titleBn?: string | null; genderScope?: AmalAudience | null; specificDay?: Weekday | null; exemptOnPeriod?: boolean | null };
type RuleContext = { gender: unknown; weekday: Weekday | string; isPeriodDay?: boolean; date?: Date };

/** The single নফল রোজা amal (recognised by its title, NFC-normalised). */
export const NAFL_FASTING_TITLE = "নফল রোজা";
export const isNaflFastingItem = (item: { titleBn?: string | null }) => (item.titleBn ?? "").normalize("NFC").trim() === NAFL_FASTING_TITLE.normalize("NFC");

/** Why নফল রোজা applies on this day ("সোমবার", "আরাফার দিন" …), or null. */
export function naflFastingReasonFor(date: Date) {
  return naflFastingReason(bangladeshDateKey(date));
}

export function isApplicableItem(item: RuleItem, ctx: RuleContext) {
  if (!isVisibleItem(item, ctx.gender)) return false;
  if (item.specificDay && item.specificDay !== ctx.weekday) return false;
  if (isNaflFastingItem(item) && (!ctx.date || !naflFastingReasonFor(ctx.date))) return false;
  if (ctx.isPeriodDay && item.exemptOnPeriod) return false;
  return true;
}

export function applicableItems<T extends RuleItem>(items: T[], ctx: RuleContext): T[] {
  return items.filter((item) => isApplicableItem(item, ctx));
}
