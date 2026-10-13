import type { AmalAudience, AmalCategory, AmalInputType, Weekday } from "@prisma/client";

/**
 * Shared shape + page configuration for the amal-item managers.
 *
 * Three surfaces render the same manager component:
 * - `/dashboard/amal-items`        → every item (combined list, legacy URL kept)
 * - `/dashboard/amal-items/men`    → ছেলেদের আমলনামা  (ALL + MALE, new items default MALE)
 * - `/dashboard/amal-items/women`  → মেয়েদের আমলনামা (ALL + FEMALE, new items default FEMALE)
 */
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
  /** মাসিকের দিনে এই আমল প্রযোজ্য নয় — গ্রিড/রিপোর্টে "—" দেখানো হয়, মিস ধরা হয় না। */
  exemptOnPeriod: boolean;
  genderScope: AmalAudience;
  specificDay: Weekday | null;
  createdById: string | null;
};

export type AmalItemsPageKey = "all" | "men" | "women";

export type AmalItemsPageConfig = {
  key: AmalItemsPageKey;
  href: string;
  switcherLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  /** Audience a NEW item is created with on this page. */
  defaultAudience: AmalAudience;
  /** `null` = every item; otherwise the only scopes listed on this page. */
  visibleScopes: AmalAudience[] | null;
};

export const AMAL_ITEMS_PAGES: Record<AmalItemsPageKey, AmalItemsPageConfig> = {
  all: {
    key: "all",
    href: "/dashboard/amal-items",
    switcherLabel: "সব আমল",
    eyebrow: "Admin / উস্তাদজি",
    title: "আমল আইটেম ব্যবস্থাপনা",
    description:
      "Daily Amalnama-এর আমল, পয়েন্ট ও category পরিচালনা করুন। নিজের যোগ করা আইটেম আপনি সম্পাদনা ও মুছে ফেলতে পারবেন।",
    defaultAudience: "ALL",
    visibleScopes: null,
  },
  men: {
    key: "men",
    href: "/dashboard/amal-items/men",
    switcherLabel: "ছেলেদের আমলনামা",
    eyebrow: "উস্তাদজি",
    title: "ছেলেদের আমলনামা",
    description:
      "পুরুষ সদস্যদের আমলনামার তালিকা — “সবার” ও “পুরুষ” ক্যাটাগরির আমল এখানে দেখা যায়। নতুন আমল যোগ করলে সেটি পুরুষদের আমলনামায় যুক্ত হবে।",
    defaultAudience: "MALE",
    visibleScopes: ["ALL", "MALE"],
  },
  women: {
    key: "women",
    href: "/dashboard/amal-items/women",
    switcherLabel: "মেয়েদের আমলনামা",
    eyebrow: "উস্তাদজি",
    title: "মেয়েদের আমলনামা",
    description:
      "নারী সদস্যদের আমলনামার তালিকা — “সবার” ও “নারী” ক্যাটাগরির আমল এখানে দেখা যায়। নারীদের জন্য প্রয়োজনীয় আমল এখানে যোগ করুন।",
    defaultAudience: "FEMALE",
    visibleScopes: ["ALL", "FEMALE"],
  },
};
