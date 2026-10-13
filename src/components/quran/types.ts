export type Mode = "surah" | "juz";
export type ViewMode = "both" | "arabic" | "bangla" | "mushaf";
export type FontSize = "small" | "medium" | "large";

export type ReaderAyah = {
  number: number;
  numberInSurah: number;
  page: number;
  surahNumber: number;
  surahName: string;
  arabic: string;
  bangla: string;
  /** Audio URL for THIS ayah only — every ayah plays its own recitation. */
  audio: string;
};

export type QuranPayload = { reciter?: string; ayahs: ReaderAyah[] };

export type Reciter = { id: string; name: string };

/** Reciters supported by /api/quran — ids must match the route whitelist. */
export const RECITERS: Reciter[] = [
  { id: "ar.alafasy", name: "মিশারি রাশেদ আলাফাসি" },
  { id: "ar.abdurrahmaansudais", name: "আব্দুর রহমান আস-সুদাইস" },
  { id: "ar.abdulbasitmurattal", name: "আব্দুল বাসিত মুরাত্তাল" },
  { id: "ar.husary", name: "মাহমুদ খালিল আল-হুসারি" },
  { id: "ar.mahermuaiqly", name: "মাহির আল-মুআইকলি" },
  { id: "ar.minshawi", name: "মুহাম্মাদ সালেহ আল-মিনশাউই" },
];

export const ARABIC_SIZE: Record<FontSize, string> = {
  small: "text-[24px] leading-[2]",
  medium: "text-[27px] leading-[2.15]",
  large: "text-[33px] leading-[2.25]",
};

export const BANGLA_SIZE: Record<FontSize, string> = {
  small: "text-sm",
  medium: "text-[15px]",
  large: "text-base",
};
