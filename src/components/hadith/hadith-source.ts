import { getBook, type HadithEntry, type HadithSectionPayload } from "@/lib/hadith";

/**
 * Server-side hadith fetching. One kitab at a time for the Bangla books
 * (Bangla + Arabic editions merged by hadith number), whole-file for the
 * smaller English books (cached in memory — they exceed Next's 2 MB fetch-cache
 * item limit, so the module cache keeps warm instances from refetching).
 */

const FAWAZ = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
const AHMED = "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@v1.2.0/db/by_book/other_books";
const WEEK = 60 * 60 * 24 * 7;

type FawazHadith = { hadithnumber: number; arabicnumber?: number | string; text?: string; grades?: { name?: string; grade?: string }[] };
type FawazSection = { hadiths?: FawazHadith[] };

type AhmedHadith = {
  idInBook: number;
  chapterId: number;
  arabic?: string;
  english?: { narrator?: string; text?: string };
};
type AhmedBook = { hadiths?: AhmedHadith[] };

async function getJson<T>(url: string, cache = true): Promise<T> {
  const response = await fetch(url, cache ? { next: { revalidate: WEEK } } : { cache: "no-store" });
  if (!response.ok) throw new Error(`Hadith source ${response.status}: ${url}`);
  return (await response.json()) as T;
}

/** Strip stray leading punctuation the source sometimes keeps ("। …"). */
function clean(text: string | undefined) {
  return (text ?? "").replace(/^[\s।.,:;\-–—]+/, "").replace(/­/g, "").trim();
}

const ahmedCache = new Map<string, Promise<AhmedBook>>();

function loadAhmed(file: string) {
  let pending = ahmedCache.get(file);
  if (!pending) {
    pending = getJson<AhmedBook>(`${AHMED}/${file}.json`, false);
    ahmedCache.set(file, pending);
    pending.catch(() => ahmedCache.delete(file));
  }
  return pending;
}

export async function fetchHadithSection(bookId: string, section: number): Promise<HadithSectionPayload> {
  const book = getBook(bookId);
  if (!book) throw new Error("Unknown hadith book");

  if (book.provider === "ahmed") {
    const data = await loadAhmed(book.source);
    const hadiths: HadithEntry[] = (data.hadiths ?? [])
      .filter((hadith) => Number(hadith.chapterId) === section)
      .map((hadith) => ({
        number: hadith.idInBook,
        text: clean(hadith.english?.text),
        arabic: (hadith.arabic ?? "").trim(),
        narrator: clean(hadith.english?.narrator) || undefined,
        grades: [],
      }));
    return { book: book.id, section, language: "en", hadiths };
  }

  const [bangla, arabic] = await Promise.all([
    getJson<FawazSection>(`${FAWAZ}/ben-${book.source}/sections/${section}.json`),
    getJson<FawazSection>(`${FAWAZ}/ara-${book.source}/sections/${section}.json`).catch(() => ({ hadiths: [] }) as FawazSection),
  ]);
  const arabicByNumber = new Map((arabic.hadiths ?? []).map((hadith) => [hadith.hadithnumber, hadith.text ?? ""]));
  const hadiths: HadithEntry[] = (bangla.hadiths ?? []).map((hadith) => {
    const reference = hadith.arabicnumber !== undefined && String(hadith.arabicnumber) !== String(hadith.hadithnumber) ? String(hadith.arabicnumber) : undefined;
    return {
      number: hadith.hadithnumber,
      reference,
      text: clean(hadith.text),
      arabic: (arabicByNumber.get(hadith.hadithnumber) ?? "").trim(),
      grades: (hadith.grades ?? []).filter((grade) => grade.grade).map((grade) => ({ name: grade.name ?? "", grade: grade.grade ?? "" })),
    };
  });
  return { book: book.id, section, language: "bn", hadiths };
}
