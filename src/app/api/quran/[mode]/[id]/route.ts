import { cleanIndoPakAyahEnd, stripBismillah } from "@/lib/quran";

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
export type ReaderAyah = {
  number: number; numberInSurah: number; page: number; surahNumber: number;
  surahName: string; arabic: string; bangla: string; audio: string;
};

const editions = ["quran-uthmani", "bn.bengali"] as const;

/** Arabic script shown to the reader. Indo-Pak (South-Asian mushaf style) is the default. */
type Script = "indopak" | "uthmani";

type IndoPakVerse = { verse_key: string; text_indopak_nastaleeq?: string };

/**
 * Indo-Pak text from the free quran.com API — the "nastaleeq" variant is the
 * one drawn for the IndoPak Nastaleeq font the reader loads. Keyed by "s:a".
 */
async function loadIndoPak(mode: string, id: number): Promise<Map<string, string>> {
  const param = mode === "surah" ? "chapter_number" : "juz_number";
  const response = await fetch(`https://api.quran.com/api/v4/quran/verses/indopak_nastaleeq?${param}=${id}`, { next: { revalidate: 604800 } });
  if (!response.ok) throw new Error(`Upstream ${response.status}`);
  const json = (await response.json()) as { verses?: IndoPakVerse[] };
  const map = new Map<string, string>();
  for (const verse of json.verses ?? []) {
    // Drop direction marks the source appends; keep every Quranic sign.
    if (verse.text_indopak_nastaleeq) map.set(verse.verse_key, cleanIndoPakAyahEnd(verse.text_indopak_nastaleeq.replace(/[‎‏]/g, "")));
  }
  return map;
}

/** Supported reciters (alquran.cloud audio editions). */
const reciters = [
  "ar.alafasy",
  "ar.abdurrahmaansudais",
  "ar.abdulbasitmurattal",
  "ar.husary",
  "ar.mahermuaiqly",
  "ar.minshawi",
] as const;
type Reciter = (typeof reciters)[number];

async function load(mode: string, id: number, edition: string): Promise<QuranData> {
  const response = await fetch(`https://api.alquran.cloud/v1/${mode}/${id}/${edition}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`Upstream ${response.status}`);
  const json = (await response.json()) as QuranResponse;
  if (!json.data?.ayahs) throw new Error("Invalid Quran response");
  return json.data;
}

/**
 * Per-ayah audio URLs for a reciter. Returns null instead of throwing so a
 * missing/unsupported reciter edition can fall back to another one.
 */
async function loadAudioMap(mode: string, id: number, reciter: string): Promise<Map<number, string> | null> {
  try {
    const data = await load(mode, id, reciter);
    const map = new Map<number, string>();
    for (const item of data.ayahs) {
      if (item.audio) map.set(item.number, item.audio);
    }
    return map;
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: { params: Promise<{ mode: string; id: string }> }) {
  const { mode, id } = await context.params;
  const numericId = Number(id);
  const maximum = mode === "surah" ? 114 : mode === "juz" ? 30 : 0;
  if (!Number.isInteger(numericId) || numericId < 1 || numericId > maximum) {
    return Response.json({ error: "Invalid Quran selection" }, { status: 400 });
  }

  const searchParams = new URL(request.url).searchParams;
  const requestedScript = searchParams.get("script");
  const script: Script = requestedScript === "uthmani" ? "uthmani" : "indopak";
  const requestedReciter = searchParams.get("reciter");
  const reciter: Reciter =
    requestedReciter && (reciters as readonly string[]).includes(requestedReciter)
      ? (requestedReciter as Reciter)
      : "ar.alafasy";

  try {
    const [arabic, bangla, audio, indopak] = await Promise.all([
      load(mode, numericId, editions[0]),
      load(mode, numericId, editions[1]),
      loadAudioMap(mode, numericId, reciter)
        .then((map) => map ?? loadAudioMap(mode, numericId, "ar.alafasy"))
        .then((map) => map ?? new Map<number, string>()),
      // Indo-Pak falls back to Uthmani text if quran.com is unreachable.
      script === "indopak" ? loadIndoPak(mode, numericId).catch(() => null) : Promise.resolve(null),
    ]);
    const banglaMap = new Map(bangla.ayahs.map((item) => [item.number, item]));
    const ayahs = arabic.ayahs.map((item): ReaderAyah => {
      const surahNumber = item.surah?.number ?? arabic.number ?? numericId;
      const surahName = item.surah?.englishName ?? arabic.englishName ?? `Surah ${surahNumber}`;
      return {
        number: item.number,
        numberInSurah: item.numberInSurah,
        page: item.page ?? 1,
        surahNumber,
        surahName,
        // Ayah 1 never repeats the bismillah \u2014 the reader shows it once as a header.
        arabic: stripBismillah(indopak?.get(`${surahNumber}:${item.numberInSurah}`) ?? item.text, surahNumber, item.numberInSurah),
        bangla: banglaMap.get(item.number)?.text ?? "",
        // Each ayah keeps its own audio URL — no merging of ayahs anywhere.
        audio: audio.get(item.number) ?? `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${item.number}.mp3`,
      };
    });
    const servedScript: Script = script === "indopak" && indopak?.size ? "indopak" : "uthmani";
    return Response.json({ reciter, script: servedScript, ayahs }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch {
    return Response.json({ error: "Quran service unavailable" }, { status: 502 });
  }
}
