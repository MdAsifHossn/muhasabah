import { fetchHadithSection } from "@/components/hadith/hadith-source";
import { getBook, getSection } from "@/lib/hadith";

/** GET /api/hadith/:book/:section → one kitab (Bangla/English + Arabic) as JSON. */
export async function GET(_request: Request, context: { params: Promise<{ book: string; chapter: string }> }) {
  const { book, chapter } = await context.params;
  const section = Number(chapter);
  if (!getBook(book) || !Number.isInteger(section) || !getSection(book, section)) {
    return Response.json({ error: "Invalid hadith selection" }, { status: 400 });
  }
  try {
    const payload = await fetchHadithSection(book, section);
    return Response.json(payload, { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000" } });
  } catch {
    return Response.json({ error: "Hadith service unavailable" }, { status: 502 });
  }
}
