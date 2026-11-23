import { NextResponse } from "next/server";

import { DUA_BOOKS, DUA_CHAPTERS } from "@/lib/dua-catalog";

/** One dua chapter as JSON — the /dua popup loads chapters on demand instead of shipping the whole catalog. */
export async function GET(_request: Request, { params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId } = await params;
  const chapter = DUA_CHAPTERS.find((entry) => entry.id === chapterId);
  if (!chapter) return NextResponse.json({ error: "পরিচ্ছেদ পাওয়া যায়নি" }, { status: 404 });
  const bookTitle = DUA_BOOKS.find((book) => book.id === chapter.bookId)?.title ?? "";
  return NextResponse.json({ chapter, bookTitle }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
