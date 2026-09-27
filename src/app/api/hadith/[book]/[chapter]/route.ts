type SourceHadith = {
  id: number;
  idInBook: number;
  chapterId: number;
  arabic: string;
  english?: { narrator?: string; text?: string };
  translation?: { narrator?: string; text?: string } | null;
  grades?: Array<{ name?: string; grade?: string }>;
};

type SourcePayload = { hadiths?: SourceHadith[] };

const sources: Record<string, { url: string; language: "bn" | "en" }> = {
  riyad: {
    url: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@v1.2.0/db/by_book/other_books/riyad_assalihin.json",
    language: "en",
  },
  adab: {
    url: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@v1.2.0/db/by_book/other_books/aladab_almufrad.json",
    language: "en",
  },
  bulugh: {
    url: "https://cdn.jsdelivr.net/gh/AhmedBaset/hadith-json@v1.2.0/db/by_book/other_books/bulugh_almaram.json",
    language: "en",
  },
  malik: {
    url: "https://cdn.jsdelivr.net/gh/hapiam/hadith-json@v1.5.0-hapi/db/unified/files/ben-malik.min.json",
    language: "bn",
  },
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ book: string; chapter: string }> },
) {
  const { book, chapter } = await context.params;
  const source = sources[book];
  const chapterNumber = Number(chapter);
  if (!source || !Number.isInteger(chapterNumber) || chapterNumber < 1) {
    return Response.json({ error: "Invalid Hadith selection" }, { status: 400 });
  }

  try {
    const response = await fetch(source.url, { next: { revalidate: 604800 } });
    if (!response.ok) throw new Error(`Upstream ${response.status}`);
    const payload = (await response.json()) as SourcePayload;
    const hadiths = (payload.hadiths ?? [])
      .filter((hadith) => Number(hadith.chapterId) === chapterNumber)
      .map((hadith) => {
        const translated = source.language === "bn" ? hadith.translation : hadith.english;
        return {
          hadith_id: hadith.idInBook ?? hadith.id,
          narrator: translated?.narrator || (source.language === "bn" ? "বর্ণনাকারী উল্লেখ নেই" : "Narrator not listed"),
          bn: translated?.text || (source.language === "bn" ? "বাংলা অনুবাদ পাওয়া যায়নি।" : "English translation unavailable."),
          ar: hadith.arabic || "",
          grade: hadith.grades?.[0]?.grade || (source.language === "bn" ? "গ্রেড উল্লেখ নেই" : "Grade not listed"),
          note: source.language === "en" ? "এই গ্রন্থের নির্ভরযোগ্য বাংলা dataset পাওয়া যায়নি; তাই মূল উৎসের English translation দেখানো হয়েছে।" : null,
        };
      });

    return Response.json(hadiths, {
      headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000" },
    });
  } catch {
    return Response.json({ error: "Hadith service unavailable" }, { status: 502 });
  }
}