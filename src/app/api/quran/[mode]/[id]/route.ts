type SurahMeta = { number: number; englishName: string };
type QuranAyah = {
  number: number;
  numberInSurah: number;
  text: string;
  audio?: string;
  page?: number;
  surah?: SurahMeta;
};
type QuranData = { ayahs: QuranAyah[]; number?: number; englishName?: string };
type QuranResponse = { code: number; data?: QuranData };
type ReaderAyah = {
  number: number; numberInSurah: number; page: number; surahNumber: number;
  surahName: string; arabic: string; bangla: string; audio: string;
};

const editions = ["quran-uthmani", "bn.bengali", "ar.alafasy"] as const;
const bismillahPattern = /^\uFEFF?\s*بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/;

async function load(mode: string, id: number, edition: string): Promise<QuranData> {
  const response = await fetch(`https://api.alquran.cloud/v1/${mode}/${id}/${edition}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`Upstream ${response.status}`);
  const json = (await response.json()) as QuranResponse;
  if (!json.data?.ayahs) throw new Error("Invalid Quran response");
  return json.data;
}

function normalizeFatiha(ayahs: ReaderAyah[]) {
  return ayahs.flatMap((ayah) => {
    if (ayah.surahNumber !== 1) return ayah;
    if (ayah.numberInSurah === 1) return [];
    if (ayah.numberInSurah < 7) return [{ ...ayah, numberInSurah: ayah.numberInSurah - 1 }];

    const arabicParts = ayah.arabic.split(/(?=غَيْرِ)/u);
    const banglaParts = ayah.bangla.split(/(?=তাদের পথ নয়)/u);
    if (arabicParts.length < 2) return [{ ...ayah, numberInSurah: 6 }];

    return [
      { ...ayah, number: ayah.number * 10, numberInSurah: 6, arabic: arabicParts[0].trim(), bangla: (banglaParts[0] ?? ayah.bangla).trim() },
      { ...ayah, number: ayah.number * 10 + 1, numberInSurah: 7, arabic: arabicParts.slice(1).join("").trim(), bangla: (banglaParts.slice(1).join("") || ayah.bangla).trim() },
    ];
  });
}

export async function GET(_request: Request, context: { params: Promise<{ mode: string; id: string }> }) {
  const { mode, id } = await context.params;
  const numericId = Number(id);
  const maximum = mode === "surah" ? 114 : mode === "juz" ? 30 : 0;
  if (!Number.isInteger(numericId) || numericId < 1 || numericId > maximum) {
    return Response.json({ error: "Invalid Quran selection" }, { status: 400 });
  }

  try {
    const [arabic, bangla, audio] = await Promise.all(editions.map((edition) => load(mode, numericId, edition)));
    const banglaMap = new Map(bangla.ayahs.map((item) => [item.number, item]));
    const audioMap = new Map(audio.ayahs.map((item) => [item.number, item]));
    const ayahs = arabic.ayahs.map((item): ReaderAyah => {
      const surahNumber = item.surah?.number ?? arabic.number ?? numericId;
      const surahName = item.surah?.englishName ?? arabic.englishName ?? `Surah ${surahNumber}`;
      return {
        number: item.number,
        numberInSurah: item.numberInSurah,
        page: item.page ?? 1,
        surahNumber,
        surahName,
        arabic: surahNumber !== 1 && surahNumber !== 9 && item.numberInSurah === 1 ? item.text.replace(bismillahPattern, "") : item.text.replace(/^\uFEFF/, ""),
        bangla: banglaMap.get(item.number)?.text ?? "",
        audio: audioMap.get(item.number)?.audio ?? `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${item.number}.mp3`,
      };
    });
    return Response.json({ ayahs: normalizeFatiha(ayahs) }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return Response.json({ error: "Quran service unavailable" }, { status: 502 });
  }
}