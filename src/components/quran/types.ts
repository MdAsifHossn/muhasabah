export type Mode = "surah" | "juz";
/** "both" = ayah cards with translation, "arabic" = cards without translation,
 *  "mushaf" = continuous Arabic, "bangla" = translation only. Values match the
 *  server progress API whitelist. */
export type ViewMode = "both" | "arabic" | "bangla" | "mushaf";
export type FontSize = "small" | "medium" | "large";
export type { ReaderThemeId as ReaderTheme } from "@/components/quran/themes";
/** Arabic script: Indo-Pak (default, South-Asian mushaf) or Uthmani (Madinah mushaf). */
export type QuranScript = "indopak" | "uthmani";

export type ReaderAyah = {
  /** Global ayah number 1..6236. */
  number: number;
  numberInSurah: number;
  page: number;
  surahNumber: number;
  surahName: string;
  arabic: string;
  bangla: string;
  /** Audio URL for THIS ayah only. */
  audio: string;
};

export type QuranPayload = { reciter?: string; script?: QuranScript; ayahs: ReaderAyah[] };

export type Reciter = { id: string; name: string };

/** Reciters supported by /api/quran — ids must match the route whitelist. */
export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "মিশারি রাশেদ আলাফাসি" },
  { id: "ar.abdurrahmaansudais", name: "আব্দুর রহমান আস-সুদাইস" },
  { id: "ar.abdulbasitmurattal", name: "আব্দুল বাসিত (মুরাত্তাল)" },
  { id: "ar.husary", name: "মাহমুদ খলীল আল-হুসারী" },
  { id: "ar.mahermuaiqly", name: "মাহির আল-মুআইকলি" },
  { id: "ar.minshawi", name: "মুহাম্মাদ সিদ্দীক আল-মিনশাভী" },
];

/** Arabic font size range (px) for the slider. */
export const ARABIC_PX = { min: 22, max: 54, step: 2 } as const;
/** Bangla translation size range (px). */
export const BANGLA_PX = { min: 14, max: 26, step: 1 } as const;

/** Coarse size stored with the server-side progress record. */
export function pxToFontSize(px: number): FontSize {
  return px <= 26 ? "small" : px >= 36 ? "large" : "medium";
}

/** Arabic font sizes (px) for the 5-step slider. */
export const ARABIC_STEPS = [24, 28, 32, 37, 43] as const;
/** Bangla translation sizes (px) for the 5-step slider. */
export const BANGLA_STEPS = [14.5, 16, 17.5, 19.5, 22] as const;

/** Coarse size stored with the server-side progress record. */
export function stepToFontSize(step: number): FontSize {
  return step <= 1 ? "small" : step >= 3 ? "large" : "medium";
}

export function fontSizeToStep(size: FontSize): number {
  return size === "small" ? 1 : size === "large" ? 3 : 2;
}
