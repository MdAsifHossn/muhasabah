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
  reference: string;
  audioUrl: string;
};
export type DailyHadith = {
  arabic: string;
  bangla: string;
  narrator: string;
  reference: string;
  grade: string;
};

const fallbackAyah: DailyAyah = {
  arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
  bangla: "নিশ্চয়ই কষ্টের সাথেই স্বস্তি রয়েছে।",
  reference: "সূরা আশ-শারহ, ৯৪:৫",
  audioUrl: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6095.mp3",
};
const fallbackHadith: DailyHadith = {
  arabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
  bangla:
    "কাজ নিয়ত অনুযায়ী মূল্যায়িত হয়; প্রত্যেক মানুষ তার নিয়ত অনুযায়ী ফল পাবে।",
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
    return {
      arabic: arabic.data.text,
      bangla: bangla.data.text,
      reference: `${surah.englishName ?? surah.name} • ${surah.number}:${verse}`,
      audioUrl:
        "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6095.mp3",
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
export type GuidanceSlide = { ayah: DailyAyah; hadith: DailyHadith };
type FullQuranResponse = {
  data?: {
    surahs?: Array<{
      number: number;
      englishName: string;
      ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
    }>;
  };
};
export const DAILY_QURAN_TARGET = 40;
export const DAILY_HADITH_TARGET = 10;
export async function getGuidanceSlides(): Promise<GuidanceSlide[]> {
  try {
    const [arabicResponse, banglaResponse, hadithResponse] = await Promise.all([
      fetch("https://api.alquran.cloud/v1/quran/quran-uthmani", {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      }),
      fetch("https://api.alquran.cloud/v1/quran/bn.bengali", {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(
        "https://cdn.jsdelivr.net/gh/md-rifatkhan/hadithbangla@main/Bukhari/Chapter/2.json",
        { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) },
      ),
    ]);
    if (!arabicResponse.ok || !banglaResponse.ok || !hadithResponse.ok)
      throw new Error("Daily content unavailable");
    const arabic = (await arabicResponse.json()) as FullQuranResponse;
    const bangla = (await banglaResponse.json()) as FullQuranResponse;
    const hadiths = (await hadithResponse.json()) as Array<{
      hadith_id: number;
      narrator: string;
      bn: string;
      ar: string;
      grade: string;
    }>;
    const ar = (arabic.data?.surahs ?? []).flatMap((s) =>
      s.ayahs.map((a) => ({
        ...a,
        surahNumber: s.number,
        surahName: s.englishName,
      })),
    );
    const bn = (bangla.data?.surahs ?? []).flatMap((s) =>
      s.ayahs.map((a) => ({
        ...a,
        surahNumber: s.number,
        surahName: s.englishName,
      })),
    );
    if (
      ar.length < 6236 ||
      bn.length < 6236 ||
      hadiths.length < DAILY_HADITH_TARGET
    )
      throw new Error("Incomplete daily content");
    const day = Math.floor(Date.now() / 86400000);
    const start = (day * DAILY_QURAN_TARGET) % ar.length;
    const daily = Array.from({ length: DAILY_QURAN_TARGET }, (_, i) => {
      const index = (start + i) % ar.length;
      return { ...ar[index], bangla: bn[index]?.text ?? "" };
    });
    const chunks = Array.from({ length: DAILY_HADITH_TARGET }, (_, i) =>
      daily.slice(
        Math.floor((i * DAILY_QURAN_TARGET) / DAILY_HADITH_TARGET),
        Math.floor(((i + 1) * DAILY_QURAN_TARGET) / DAILY_HADITH_TARGET),
      ),
    );
    const hadithStart = (day * DAILY_HADITH_TARGET) % hadiths.length;
    return chunks.map((chunk, i) => {
      const first = chunk[0],
        last = chunk[chunk.length - 1],
        hadith = hadiths[(hadithStart + i) % hadiths.length];
      return {
        ayah: {
          arabic: chunk.map((a) => a.text).join(" ۝ "),
          bangla: chunk.map((a) => `${a.numberInSurah}. ${a.bangla}`).join(" "),
          reference:
            first.surahNumber === last.surahNumber
              ? `${first.surahName} • ${first.surahNumber}:${first.numberInSurah}–${last.numberInSurah}`
              : `${first.surahName} ${first.surahNumber}:${first.numberInSurah} — ${last.surahName} ${last.surahNumber}:${last.numberInSurah}`,
          audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${first.number}.mp3`,
        },
        hadith: {
          arabic: hadith.ar,
          bangla: hadith.bn,
          narrator: hadith.narrator,
          reference: `সহীহ বুখারী • হাদীস ${hadith.hadith_id}`,
          grade: hadith.grade,
        },
      };
    });
  } catch {
    return Array.from({ length: DAILY_HADITH_TARGET }, () => ({
      ayah: fallbackAyah,
      hadith: fallbackHadith,
    }));
  }
}
