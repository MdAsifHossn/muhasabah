import { SURAH_LIST } from "@/lib/quran";

type QuranEdition = {
  data?: {
    text?: string;
    surah?: { number?: number; name?: string; englishName?: string };
    numberInSurah?: number;
  };
};
type HadithPayload = {
  hadith?: {
    hadith_id?: number;
    narrator?: string;
    bn?: string;
    ar?: string;
    grade?: string;
  };
};

export type DailyAyah = {
  arabic: string;
  bangla: string;
  /** Exact range shown in the page header, e.g. "আল-ফজর • ৮৯:১৬–১৯". */
  reference: string;
  /** This ayah's own mp3. */
  audioUrl: string;
  /** Sequential playlist of every ayah in today's portion (identical on every ayah/page). */
  audioUrls: string[];
  /** 1-based ayah number across the whole Qur'an (== its position in the playlist). */
  globalAyah: number;
  surahNumber: number;
  /** Bengali surah name, e.g. "সূরা আল-ফজর". */
  surahName: string;
  /** Total ayah count of the surah, e.g. 20 for Al-Fajr. */
  ayahCountInSurah: number;
  /** 1-based ayah number inside its surah. */
  numberInSurah: number;
};
export type DailyHadith = {
  arabic: string;
  bangla: string;
  narrator: string;
  reference: string;
  grade: string;
};

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
/** Bengali numerals for every digit, e.g. 89 → "৮৯" (no locale grouping surprises). */
export function toBnDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => BN_DIGITS[Number(digit)]);
}

/** Bengali name of a surah without the leading "সূরা " (for range references). */
function shortSurahName(surahName: string): string {
  return surahName.replace(/^সূরা /, "");
}

function bengaliSurahName(surahNumber: number): string {
  return SURAH_LIST[surahNumber - 1]?.banglaName ?? `সূরা ${surahNumber}`;
}

const fallbackAyah: DailyAyah = {
  arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
  bangla: "নিশ্চয়ই কষ্টের সাথেই স্বস্তি রয়েছে।",
  reference: "আশ-শারহ • ৯৪:৫",
  audioUrl: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6095.mp3",
  audioUrls: ["https://cdn.islamic.network/quran/audio/128/ar.alafasy/6095.mp3"],
  globalAyah: 6095,
  surahNumber: 94,
  surahName: "সূরা আশ-শারহ",
  ayahCountInSurah: 8,
  numberInSurah: 5,
};
const fallbackHadith: DailyHadith = {
  arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
  bangla:
    "কাজ নিয়ত অনুযায়ী মূল্যায়িত হয়; প্রত্যেক মানুষ তার নিয়ত অনুযায়ী ফল পাবে।",
  narrator: "উমর ইবনুল খাত্তাব (রাঃ)",
  reference: "সহীহ বুখারী, হাদীস ১",
  grade: "সহিহ হাদিস",
};

export async function getDailyAyah(): Promise<DailyAyah> {
  try {
    const [arabicResponse, banglaResponse] = await Promise.all([
      fetch("https://api.alquran.cloud/v1/ayah/6095/quran-uthmani", {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      }),
      fetch("https://api.alquran.cloud/v1/ayah/6095/bn.bengali", {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      }),
    ]);
    if (!arabicResponse.ok || !banglaResponse.ok) return fallbackAyah;
    const arabic = (await arabicResponse.json()) as QuranEdition;
    const bangla = (await banglaResponse.json()) as QuranEdition;
    const surah = arabic.data?.surah;
    const verse = arabic.data?.numberInSurah;
    if (!arabic.data?.text || !bangla.data?.text || !surah?.number || !verse)
      return fallbackAyah;
    const surahName = bengaliSurahName(surah.number);
    return {
      arabic: arabic.data.text,
      bangla: bangla.data.text,
      reference: `${shortSurahName(surahName)} • ${toBnDigits(surah.number)}:${toBnDigits(verse)}`,
      audioUrl:
        "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6095.mp3",
      audioUrls: [
        "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6095.mp3",
      ],
      globalAyah: 6095,
      surahNumber: surah.number,
      surahName,
      ayahCountInSurah:
        SURAH_LIST[surah.number - 1]?.numberOfAyahs ?? fallbackAyah.ayahCountInSurah,
      numberInSurah: verse,
    };
  } catch {
    return fallbackAyah;
  }
}

export async function getDailyHadith(): Promise<DailyHadith> {
  try {
    const response = await fetch(
      "https://cdn.jsdelivr.net/gh/md-rifatkhan/hadithbangla@main/Bukhari/hadith/1.json",
      { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return fallbackHadith;
    const json = (await response.json()) as HadithPayload;
    const hadith = json.hadith;
    if (!hadith?.bn || !hadith.ar) return fallbackHadith;
    return {
      arabic: hadith.ar,
      bangla: hadith.bn,
      narrator: hadith.narrator ?? "",
      reference: `সহীহ বুখারী • হাদীস ${hadith.hadith_id ?? 1}`,
      grade: hadith.grade ?? "সহিহ হাদিস",
    };
  } catch {
    return fallbackHadith;
  }
}

/** One surah-aware page of today's Qur'an portion (always ≤ 5 ayahs, contiguous). */
export type QuranPage = {
  ayahs: DailyAyah[];
  /** Exact range of this page, e.g. "আল-ফজর • ৮৯:১৬–১৯". */
  reference: string;
  /** Position of the first ayah inside the 40-ayah playlist (0-based). */
  startIndex: number;
  /** The full 40-ayah playlist — identical on every page so recitation never restarts. */
  audioUrls: string[];
};

/** Decoupled landing content: Qur'an pages and the 10 hadiths are independent. */
export type DailyGuidance = {
  quranPages: QuranPage[];
  hadiths: DailyHadith[];
};

type SurahMeta = {
  number: number;
  englishName: string;
  numberOfAyahs: number;
};
type MetaResponse = { data?: { surahs?: { references?: SurahMeta[] } } };
type SurahAyah = { number: number; numberInSurah: number; text: string };
type SurahResponse = {
  data?: { number?: number; englishName?: string; ayahs?: SurahAyah[] };
};
type HadithEntry = {
  hadith_id: number;
  narrator: string;
  bn: string;
  ar: string;
  grade: string;
};
type WindowAyah = SurahAyah & {
  bangla: string;
  surahNumber: number;
  surahName: string;
  ayahCountInSurah: number;
};

export const DAILY_QURAN_TARGET = 40;
export const DAILY_HADITH_TARGET = 10;
/** Hard cap for a landing page — never show more than 5 ayahs at once. */
export const MAX_QURAN_PAGE_SIZE = 5;
/** Below this a page would read as a stub, so surah breaks are shifted instead. */
const MIN_QURAN_PAGE_SIZE = 3;

/** Short timeout: the landing page must never stall on a slow upstream. */
const SHORT_TIMEOUT_MS = 3000;
const QURAN_API = "https://api.alquran.cloud/v1";
const AYAH_AUDIO_BASE = "https://cdn.islamic.network/quran/audio/128/ar.alafasy";
const HADITH_CHAPTER_URL =
  "https://cdn.jsdelivr.net/gh/md-rifatkhan/hadithbangla@main/Bukhari/Chapter/2.json";

function fetchJson<T>(url: string): Promise<T | null> {
  return fetch(url, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(SHORT_TIMEOUT_MS),
  })
    .then((response) => (response.ok ? (response.json() as Promise<T>) : null))
    .catch(() => null);
}

function placeholderGuidance(): DailyGuidance {
  return {
    quranPages: [
      {
        ayahs: [fallbackAyah],
        reference: fallbackAyah.reference,
        startIndex: 0,
        audioUrls: fallbackAyah.audioUrls,
      },
    ],
    hadiths: Array.from({ length: DAILY_HADITH_TARGET }, () => fallbackHadith),
  };
}

/**
 * Split today's window into pages that respect surah boundaries.
 *
 * 1. A new page starts when the ayah belongs to a new surah — but only once
 *    the current page already holds ≥3 ayahs (otherwise the page swallows the
 *    boundary and the renderer prints the surah header + bismillah mid-page),
 *    or when the page reaches MAX_QURAN_PAGE_SIZE (that break is always
 *    mid-surah, so the next page simply continues without a header).
 * 2. A 1–2 ayah tail is rebalanced: merged with a neighbour when both still
 *    fit in 5, otherwise a couple of ayahs are borrowed from the previous
 *    page. Every page ends up with 3–5 ayahs and never more than 5.
 */
export function paginateAyahs(ayahs: DailyAyah[]): DailyAyah[][] {
  const pages: DailyAyah[][] = [];
  let start = 0;
  while (start < ayahs.length) {
    let end = start + 1;
    while (end < ayahs.length && end - start < MAX_QURAN_PAGE_SIZE) {
      const atSurahBoundary =
        ayahs[end].surahNumber !== ayahs[end - 1].surahNumber;
      if (atSurahBoundary && end - start >= MIN_QURAN_PAGE_SIZE) break;
      end++;
    }
    pages.push(ayahs.slice(start, end));
    start = end;
  }

  for (let i = pages.length - 1; i >= 0; i--) {
    const page = pages[i];
    if (page.length >= MIN_QURAN_PAGE_SIZE) continue;
    const prev = i > 0 ? pages[i - 1] : undefined;
    const next = pages[i + 1];
    if (next && page.length + next.length <= MAX_QURAN_PAGE_SIZE) {
      pages[i] = page.concat(next);
      pages.splice(i + 1, 1);
    } else if (prev && prev.length + page.length <= MAX_QURAN_PAGE_SIZE) {
      pages[i - 1] = prev.concat(page);
      pages.splice(i, 1);
    } else if (prev) {
      const needed = MIN_QURAN_PAGE_SIZE - page.length;
      if (prev.length - needed >= MIN_QURAN_PAGE_SIZE) {
        for (let k = 0; k < needed; k++) page.unshift(prev.pop()!);
      }
    }
  }

  return pages;
}

/** Range shown in a page header, e.g. "আল-ফজর • ৮৯:১৬–১৯". */
function pageReference(page: DailyAyah[]): string {
  const first = page[0];
  const last = page[page.length - 1];
  const firstRange = `${toBnDigits(first.surahNumber)}:${toBnDigits(first.numberInSurah)}`;
  if (first.surahNumber === last.surahNumber) {
    return `${shortSurahName(first.surahName)} • ${firstRange}–${toBnDigits(last.numberInSurah)}`;
  }
  return `${shortSurahName(first.surahName)} ${firstRange} — ${shortSurahName(last.surahName)} ${toBnDigits(last.surahNumber)}:${toBnDigits(last.numberInSurah)}`;
}

/**
 * Today's 40-ayah window of the Qur'an (surah-aware pages) plus 10 hadiths.
 *
 * Instead of downloading the whole Qur'an (~6,236 ayahs in two editions) on
 * every cold render, we read the surah lengths from `/v1/meta` and fetch only
 * the surah(s) that cover today's window (usually one or two short requests).
 * The hadith selection is completely independent of the Qur'an pagination.
 */
export async function getDailyGuidance(): Promise<DailyGuidance> {
  try {
    const [meta, hadiths] = await Promise.all([
      fetchJson<MetaResponse>(`${QURAN_API}/meta`),
      fetchJson<HadithEntry[]>(HADITH_CHAPTER_URL),
    ]);
    const surahs = meta?.data?.surahs?.references;
    if (!surahs?.length) throw new Error("Surah meta unavailable");
    if (!hadiths || hadiths.length < DAILY_HADITH_TARGET)
      throw new Error("Daily hadith unavailable");

    // Cumulative offsets: index i starts at offsets[i] (0-based global index).
    const offsets: number[] = [];
    let totalAyahs = 0;
    for (const surah of surahs) {
      offsets.push(totalAyahs);
      totalAyahs += surah.numberOfAyahs;
    }
    if (totalAyahs < 6000) throw new Error("Invalid surah meta");
    const ayahCountBySurah = new Map(
      surahs.map((surah) => [surah.number, surah.numberOfAyahs]),
    );

    const day = Math.floor(Date.now() / 86400000);
    const start = (day * DAILY_QURAN_TARGET) % totalAyahs;

    const surahIndexOf = (globalIndex: number): number => {
      let low = 0;
      let high = offsets.length - 1;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (offsets[mid] <= globalIndex) low = mid;
        else high = mid - 1;
      }
      return low;
    };

    // Which surah(s) does today's 40-ayah window touch? Usually one or two.
    const first = surahIndexOf(start);
    const last = surahIndexOf((start + DAILY_QURAN_TARGET - 1) % totalAyahs);
    const covering: number[] = [];
    for (
      let step = 0, index = first;
      step < surahs.length;
      step++, index = (index + 1) % surahs.length
    ) {
      covering.push(surahs[index].number);
      if (index === last) break;
    }

    const [arabicParts, banglaParts] = await Promise.all([
      Promise.all(
        covering.map((number) =>
          fetchJson<SurahResponse>(`${QURAN_API}/surah/${number}/quran-uthmani`),
        ),
      ),
      Promise.all(
        covering.map((number) =>
          fetchJson<SurahResponse>(`${QURAN_API}/surah/${number}/bn.bengali`),
        ),
      ),
    ]);

    const arabicByNumber = new Map<number, WindowAyah>();
    arabicParts.forEach((payload, i) => {
      const data = payload?.data;
      if (!data?.ayahs?.length) return;
      const surahNumber = data.number ?? covering[i];
      const surahName = bengaliSurahName(surahNumber);
      for (const ayah of data.ayahs) {
        arabicByNumber.set(ayah.number, {
          ...ayah,
          bangla: "",
          surahNumber,
          surahName,
          ayahCountInSurah:
            ayahCountBySurah.get(surahNumber) ??
            SURAH_LIST[surahNumber - 1]?.numberOfAyahs ??
            data.ayahs.length,
        });
      }
    });
    const banglaByNumber = new Map<number, string>();
    for (const payload of banglaParts) {
      for (const ayah of payload?.data?.ayahs ?? []) {
        banglaByNumber.set(ayah.number, ayah.text);
      }
    }

    const daily: WindowAyah[] = [];
    for (let i = 0; i < DAILY_QURAN_TARGET; i++) {
      const number = ((start + i) % totalAyahs) + 1; // global ayah number (1-based)
      const arabic = arabicByNumber.get(number);
      const bangla = banglaByNumber.get(number);
      if (!arabic || !bangla) throw new Error("Incomplete daily window");
      daily.push({ ...arabic, bangla });
    }

    // One playlist for the whole window — recitation flows across pages.
    const audioUrls = daily.map(
      (ayah) => `${AYAH_AUDIO_BASE}/${ayah.number}.mp3`,
    );
    const ayahs: DailyAyah[] = daily.map((ayah, index) => ({
      arabic: ayah.text,
      bangla: ayah.bangla,
      reference: `${shortSurahName(ayah.surahName)} • ${toBnDigits(ayah.surahNumber)}:${toBnDigits(ayah.numberInSurah)}`,
      audioUrl: audioUrls[index],
      audioUrls,
      globalAyah: ayah.number,
      surahNumber: ayah.surahNumber,
      surahName: ayah.surahName,
      ayahCountInSurah: ayah.ayahCountInSurah,
      numberInSurah: ayah.numberInSurah,
    }));

    const quranPages: QuranPage[] = paginateAyahs(ayahs).map((page) => ({
      ayahs: page,
      reference: pageReference(page),
      startIndex: ayahs.indexOf(page[0]),
      audioUrls,
    }));

    const hadithStart = (day * DAILY_HADITH_TARGET) % hadiths.length;
    const dailyHadiths: DailyHadith[] = Array.from(
      { length: DAILY_HADITH_TARGET },
      (_, i) => {
        const hadith = hadiths[(hadithStart + i) % hadiths.length];
        return {
          arabic: hadith.ar,
          bangla: hadith.bn,
          narrator: hadith.narrator,
          reference: `সহীহ বুখারী • হাদীস ${hadith.hadith_id}`,
          grade: hadith.grade,
        };
      },
    );

    if (!quranPages.length) throw new Error("Empty Qur'an window");
    return { quranPages, hadiths: dailyHadiths };
  } catch {
    return placeholderGuidance();
  }
}
