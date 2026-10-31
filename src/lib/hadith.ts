import { SECTION_NAMES_BN } from "@/components/hadith/section-names-bn";
import SECTIONS from "@/components/hadith/sections.json";

/**
 * Hadith library — book metadata and the static kitab (section) index.
 * Client-safe: no fetching here (see components/hadith/hadith-source.ts).
 *
 * Sources
 * - "fawaz"  : fawazahmed0/hadith-api — Bangla (ben-*) + Arabic (ara-*) editions,
 *              fetched one kitab at a time.
 * - "ahmed"  : AhmedBaset/hadith-json — Arabic + English (no Bangla dataset exists).
 * The section index (`sections.json`) was generated from both sources so that
 * book pages render instantly without downloading a 10 MB index.
 */

export type HadithProvider = "fawaz" | "ahmed";

export type HadithBook = {
  id: string;
  nameBn: string;
  nameAr: string;
  nameEn: string;
  compilerBn: string;
  description: string;
  group: "sitta" | "other" | "english";
  provider: HadithProvider;
  /** fawaz edition slug (without ben-/ara- prefix) or ahmed file name. */
  source: string;
  language: "bn" | "en";
  /** Bukhari & Muslim: every hadith is sahih by consensus. */
  allSahih?: boolean;
};

export const HADITH_BOOKS: HadithBook[] = [
  { id: "bukhari", nameBn: "সহীহ বুখারী", nameAr: "صحيح البخاري", nameEn: "Sahih al-Bukhari", compilerBn: "ইমাম বুখারী (রহ.)", description: "কুরআনের পর সর্বাধিক বিশুদ্ধ গ্রন্থ হিসেবে উম্মাহর নিকট গৃহীত।", group: "sitta", provider: "fawaz", source: "bukhari", language: "bn", allSahih: true },
  { id: "muslim", nameBn: "সহীহ মুসলিম", nameAr: "صحيح مسلم", nameEn: "Sahih Muslim", compilerBn: "ইমাম মুসলিম (রহ.)", description: "বিন্যাস ও সনদের বিশুদ্ধতায় অনন্য সহীহ সংকলন।", group: "sitta", provider: "fawaz", source: "muslim", language: "bn", allSahih: true },
  { id: "abudawud", nameBn: "সুনানে আবু দাউদ", nameAr: "سنن أبي داود", nameEn: "Sunan Abi Dawud", compilerBn: "ইমাম আবু দাউদ (রহ.)", description: "আহকাম ও ফিকহ বিষয়ক হাদীসের গুরুত্বপূর্ণ সংকলন।", group: "sitta", provider: "fawaz", source: "abudawud", language: "bn" },
  { id: "tirmidhi", nameBn: "জামে আত-তিরমিযী", nameAr: "جامع الترمذي", nameEn: "Jami at-Tirmidhi", compilerBn: "ইমাম তিরমিযী (রহ.)", description: "হাদীসের মান ও ফকীহগণের মতামতসহ সংকলিত।", group: "sitta", provider: "fawaz", source: "tirmidhi", language: "bn" },
  { id: "nasai", nameBn: "সুনানে নাসাঈ", nameAr: "سنن النسائي", nameEn: "Sunan an-Nasa'i", compilerBn: "ইমাম নাসাঈ (রহ.)", description: "সনদ যাচাইয়ে কঠোরতার জন্য প্রসিদ্ধ সুনান গ্রন্থ।", group: "sitta", provider: "fawaz", source: "nasai", language: "bn" },
  { id: "ibnmajah", nameBn: "সুনানে ইবনে মাজাহ", nameAr: "سنن ابن ماجه", nameEn: "Sunan Ibn Majah", compilerBn: "ইমাম ইবনে মাজাহ (রহ.)", description: "কুতুবে সিত্তার ষষ্ঠ গ্রন্থ।", group: "sitta", provider: "fawaz", source: "ibnmajah", language: "bn" },
  { id: "malik", nameBn: "মুয়াত্তা ইমাম মালিক", nameAr: "موطأ مالك", nameEn: "Muwatta Malik", compilerBn: "ইমাম মালিক (রহ.)", description: "মদীনার আমল ও ফিকহসহ প্রাচীনতম হাদীস-গ্রন্থ।", group: "other", provider: "fawaz", source: "malik", language: "bn" },
  { id: "nawawi", nameBn: "আরবাঈন আন-নববী", nameAr: "الأربعون النووية", nameEn: "Forty Hadith of an-Nawawi", compilerBn: "ইমাম নববী (রহ.)", description: "দ্বীনের মূলনীতি সংবলিত বিখ্যাত চল্লিশ হাদীস — মুখস্থ করার উপযোগী।", group: "other", provider: "fawaz", source: "nawawi", language: "bn" },
  { id: "riyad", nameBn: "রিয়াদুস সালিহীন", nameAr: "رياض الصالحين", nameEn: "Riyad as-Salihin", compilerBn: "ইমাম নববী (রহ.)", description: "আখলাক, আদব ও দৈনন্দিন আমলের নির্বাচিত হাদীস।", group: "english", provider: "ahmed", source: "riyad_assalihin", language: "en" },
  { id: "adab", nameBn: "আল-আদাবুল মুফরাদ", nameAr: "الأدب المفرد", nameEn: "Al-Adab al-Mufrad", compilerBn: "ইমাম বুখারী (রহ.)", description: "ইসলামী শিষ্টাচার ও চরিত্রগঠনের হাদীস।", group: "english", provider: "ahmed", source: "aladab_almufrad", language: "en" },
  { id: "mishkat", nameBn: "মিশকাতুল মাসাবীহ", nameAr: "مشكاة المصابيح", nameEn: "Mishkat al-Masabih", compilerBn: "খতীব আত-তিবরীযী (রহ.)", description: "মাদরাসায় পঠিত প্রসিদ্ধ হাদীস-সংকলন; বিষয়ভিত্তিক বিন্যাস।", group: "english", provider: "ahmed", source: "mishkat_almasabih", language: "en" },
  { id: "bulugh", nameBn: "বুলুগুল মারাম", nameAr: "بلوغ المرام", nameEn: "Bulugh al-Maram", compilerBn: "ইবনে হাজার আসকালানী (রহ.)", description: "আহকামের দলিলভিত্তিক হাদীস সংকলন।", group: "english", provider: "ahmed", source: "bulugh_almaram", language: "en" },
];

export const BOOK_GROUPS: { id: HadithBook["group"]; title: string; note?: string }[] = [
  { id: "sitta", title: "কুতুবে সিত্তাহ", note: "বাংলা অনুবাদ ও আরবি মূলসহ" },
  { id: "other", title: "অন্যান্য গুরুত্বপূর্ণ গ্রন্থ", note: "বাংলা অনুবাদ ও আরবি মূলসহ" },
  { id: "english", title: "ইংরেজি অনুবাদ", note: "নির্ভরযোগ্য বাংলা ডেটাসেট পাওয়া যায়নি — আরবি মূল ও ইংরেজি অনুবাদ" },
];

export type HadithSection = {
  number: number;
  nameBn?: string;
  nameEn: string;
  nameAr?: string;
  first: number;
  last: number;
};

type RawIndex = Record<string, { last: number; sections: (string | number)[][] }>;
const INDEX = SECTIONS as RawIndex;

export function getBook(id: string): HadithBook | undefined {
  return HADITH_BOOKS.find((book) => book.id === id);
}

export function getSections(bookId: string): HadithSection[] {
  const rows = INDEX[bookId]?.sections ?? [];
  const bn = SECTION_NAMES_BN[bookId] ?? {};
  return rows.map(([number, nameEn, first, last, nameAr]) => ({
    number: Number(number),
    nameEn: String(nameEn).trim(),
    nameAr: nameAr ? String(nameAr) : undefined,
    nameBn: bn[Number(number)],
    first: Number(first),
    last: Number(last),
  }));
}

export function getSection(bookId: string, number: number) {
  return getSections(bookId).find((section) => section.number === number);
}

/** Total hadith count of a book (highest hadith number in the source). */
export function getBookTotal(bookId: string) {
  return INDEX[bookId]?.last ?? 0;
}

/** The section containing hadith number `n` (by the book's own numbering). */
export function findSectionByHadith(bookId: string, n: number) {
  return getSections(bookId).find((section) => n >= section.first && n <= section.last);
}

export function sectionTitle(section: HadithSection) {
  return section.nameBn ?? section.nameEn;
}

/** Bangla digits for numbers shown in the UI. */
export function bn(value: number | string) {
  return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

// ── Reader payload ───────────────────────────────────────────────────────

export type HadithGrade = { name: string; grade: string };

export type HadithEntry = {
  /** Number in the book (the URL anchor uses this). */
  number: number;
  /** Alternate reference (e.g. Muslim's Arabic numbering "8.01") when it differs. */
  reference?: string;
  text: string;
  arabic: string;
  narrator?: string;
  grades: HadithGrade[];
};

export type HadithSectionPayload = {
  book: string;
  section: number;
  language: "bn" | "en";
  hadiths: HadithEntry[];
};

export type GradeTone = "sahih" | "hasan" | "daif" | "fabricated" | "unknown";

/** Collapse the many scholar grades to one readable label + tone. */
export function summarizeGrade(grades: HadithGrade[], allSahih?: boolean): { label: string; tone: GradeTone } {
  if (allSahih) return { label: "সহীহ", tone: "sahih" };
  const text = grades.map((grade) => grade.grade.toLowerCase()).join(" | ");
  if (!text) return { label: "মান উল্লেখ নেই", tone: "unknown" };
  // Prefer Al-Albani's verdict when present (most widely referenced).
  const albani = grades.find((grade) => /alban/i.test(grade.name))?.grade.toLowerCase() ?? text;
  if (/maud|mawd|fabricat|موضوع/.test(albani)) return { label: "জাল", tone: "fabricated" };
  if (/da.?if|daeef|weak|munkar|shadh|ضعيف/.test(albani)) return { label: "দঈফ", tone: "daif" };
  if (/hasan/.test(albani) && /sahih/.test(albani)) return { label: "হাসান সহীহ", tone: "sahih" };
  if (/sahih|صحيح/.test(albani)) return { label: "সহীহ", tone: "sahih" };
  if (/hasan|حسن/.test(albani)) return { label: "হাসান", tone: "hasan" };
  return { label: grades[0]?.grade ?? "অজ্ঞাত", tone: "unknown" };
}

export const PAGE_SIZE = 25;
