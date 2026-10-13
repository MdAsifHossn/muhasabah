import { RECITERS } from "@/components/quran/types";
import type { FontSize, ViewMode } from "@/components/quran/types";

/**
 * Shared Quran reading-progress helpers, safe for BOTH the browser and route
 * handlers (no server-only imports here — auth/prisma stay in the API route).
 *
 * Correctness note: `/api/quran/[mode]/[id]` returns `ayah.number` as the
 * GLOBAL ayah number (1..6236) for both surah and juz modes (verified against
 * surah/114 → 6231..6236 and juz/30 → 5673..6236), so no offset math is needed.
 */
export const TOTAL_AYAHS = 6236;
export const SURAH_COUNT = 114;
export const JUZ_COUNT = 30;
export const MAX_AYAHS_PER_SURAH = 286;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Bengali numerals without group separators: 6236 → "৬২৩৬". */
export function toBn(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(Math.trunc(value)).replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)]);
}

/** Truncates to an integer and clamps it into [min, max]; null when unusable. */
export function toIntInRange(value: unknown, min: number, max: number): number | null {
  const num =
    typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : NaN;
  if (!Number.isFinite(num)) return null;
  const int = Math.trunc(num);
  return int >= min && int <= max ? int : null;
}

export function isViewMode(value: unknown): value is ViewMode {
  return value === "both" || value === "arabic" || value === "bangla" || value === "mushaf";
}

export function isFontSize(value: unknown): value is FontSize {
  return value === "small" || value === "medium" || value === "large";
}

export function isReciter(value: unknown): value is string {
  return typeof value === "string" && RECITERS.some((reciter) => reciter.id === value);
}

/**
 * Keeps only integer GLOBAL ayah numbers inside 1..6236, deduplicated and
 * sorted. Used on both sides so a malformed client payload can never poison
 * the stored coverage set.
 */
export function sanitizeReadAyahs(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<number>();
  for (const item of value) {
    const number = toIntInRange(item, 1, TOTAL_AYAHS);
    if (number !== null) unique.add(number);
  }
  return Array.from(unique).sort((a, b) => a - b);
}

/** Body accepted by POST /api/quran/progress (all fields optional except mode). */
export type QuranProgressBody = {
  mode: "surah" | "juz";
  surah: number;
  juz?: number | null;
  ayahInSurah: number;
  globalAyah: number;
  viewMode?: ViewMode | null;
  fontSize?: FontSize | null;
  reciter?: string | null;
  /** ONLY newly-seen global ayah numbers — the server unions them. */
  newRead?: number[];
};

/** Shape returned by GET/POST /api/quran/progress (null when nothing saved). */
export type QuranProgressRecord = {
  id?: string;
  mode: "surah" | "juz";
  surah: number;
  juz: number | null;
  ayahInSurah: number;
  globalAyah: number;
  viewMode: ViewMode | null;
  fontSize: FontSize | null;
  reciter: string | null;
  readAyahs: number[];
  updatedAt?: string;
};
