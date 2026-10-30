import type { AmalAudience, AmalCategory, AmalInputType, Weekday } from "@prisma/client";

/** Client-safe shape of an amal item for the staff manager. */
export type AmalItemView = {
  id: string;
  titleBn: string;
  titleEn: string | null;
  description: string | null;
  category: AmalCategory;
  inputType: AmalInputType;
  targetValue: number | null;
  unit: string | null;
  points: number;
  order: number;
  isActive: boolean;
  isRequired: boolean;
  /** মাসিকের দিনে এই আমল প্রযোজ্য নয় — রিপোর্টে "—", মিস ধরা হয় না। */
  exemptOnPeriod: boolean;
  genderScope: AmalAudience;
  specificDay: Weekday | null;
  createdById: string | null;
  creatorName: string | null;
};

/** Manager tab. `/dashboard/amal-items/men` and `/women` open on their tab. */
export type AmalItemsTab = "all" | "men" | "women" | "jumuah";
/** Kept for the three route files. */
export type AmalItemsPageKey = "all" | "men" | "women";

/** What a member of each gender is shown today and on a Friday (active items only). */
export type AmalPreview = {
  todayLabel: string;
  isFriday: boolean;
  male: { today: number; friday: number; points: number };
  female: { today: number; friday: number; points: number };
};
