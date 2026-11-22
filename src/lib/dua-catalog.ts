import catalog from "@/data/dua-catalog.json";
import { normalizeIslamicSearch } from "@/lib/islamic-search";

export type DuaChapter = (typeof catalog.chapters)[number];
export type CatalogDua = DuaChapter["duas"][number];
export const DUA_BOOKS = catalog.books;
export const DUA_CATEGORIES = catalog.categories;
export const DUA_SOURCE = catalog.source;
export const DUA_CHAPTERS = catalog.chapters;
export const DUA_COUNT = DUA_CHAPTERS.reduce((count, chapter) => count + chapter.duas.length, 0);

const searchable = new Map(DUA_CHAPTERS.map((chapter) => [chapter.id, normalizeIslamicSearch([
  chapter.title,
  ...chapter.duas.flatMap((dua) => [dua.title, dua.tags, ...dua.segments.flatMap((segment) => [segment.arabic, segment.pronunciation, segment.meaning, segment.reference])]),
].join(" "))]));

export function searchDuaChapters({ query = "", book = "", category = "" }: { query?: string; book?: string; category?: string } = {}) {
  const terms = normalizeIslamicSearch(query).split(" ").filter(Boolean);
  return DUA_CHAPTERS.filter((chapter) =>
    (!book || String(chapter.bookId) === book) &&
    (!category || chapter.duas.some((dua) => dua.categoryIds.includes(Number(category)))) &&
    terms.every((term) => searchable.get(chapter.id)!.includes(term)),
  );
}

