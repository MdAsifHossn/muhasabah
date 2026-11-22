// Refresh the bundled catalog explicitly; the application never depends on this API at runtime.
import { mkdir, writeFile, rename } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const base = "https://dua-api.hisnul.workers.dev";
const output = new URL("../src/data/dua-catalog.json", import.meta.url);
async function read(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(base + path, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
      const result = await response.json();
      if (!result.success || !Array.isArray(result.data)) throw new Error(`Invalid response: ${path}`);
      return result.data;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

const books = await read("/api/books");
const categories = await read("/api/categories");
const jobs = [];
for (const book of books) {
  const chapters = await read(`/api/books/${book.book_id}/chapters`);
  if (chapters.length !== book.chapter_count) throw new Error("Incomplete chapter list");
  for (const chapter of chapters) jobs.push({ book, chapter });
}
const chapters = new Array(jobs.length);
let cursor = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < jobs.length) {
    const index = cursor++;
    const { book, chapter } = jobs[index];
    const entries = await read(`/api/books/${book.book_id}/chapters/${chapter.chap_id}/duas`);
    if (entries.length !== chapter.dua_count) throw new Error("Incomplete chapter content");
    chapters[index] = {
      id: `${book.book_id}-${chapter.chap_id}`,
      bookId: book.book_id,
      number: chapter.chap_id,
      title: chapter.chapname || entries.find((entry) => entry.chapname)?.chapname || entries[0].duaname,
      duas: entries.map((entry) => {
        if (!entry.duaname || !entry.segments?.length) throw new Error(`Empty dua ${entry.dua_global_id}`);
        return {
          id: entry.dua_global_id,
          title: entry.duaname,
          tags: entry.tags || "",
          categoryIds: entry.categories.map((category) => category.id),
          segments: entry.segments.map((segment) => ({
            introduction: segment.top || "",
            arabic: segment.arabic || "",
            pronunciation: segment.transliteration || "",
            meaning: segment.translations || "",
            note: segment.bottom || "",
            reference: segment.reference || "",
          })),
        };
      }),
    };
    if ((index + 1) % 30 === 0) process.stdout.write(`Imported ${index + 1}/${jobs.length} chapters\n`);
  }
}));
const ids = chapters.flatMap((chapter) => chapter.duas.map((dua) => dua.id));
if (new Set(ids).size !== ids.length) throw new Error("Duplicate dua IDs");
for (const book of books) {
  const count = chapters.filter((chapter) => chapter.bookId === book.book_id).reduce((sum, chapter) => sum + chapter.duas.length, 0);
  if (count !== book.dua_count) throw new Error(`Incomplete book ${book.book_id}`);
}
const catalog = {
  source: { name: "ThelightHub / Hisnul Muslim Dua API", url: "https://github.com/ThelightHub/dua-api", api: base, license: "MIT (repository README)", retrievedAt: new Date().toISOString().slice(0, 10) },
  books: books.map((book) => ({ id: book.book_id, title: book.name, chapterCount: book.chapter_count, duaCount: book.dua_count })),
  categories: categories.map((category) => ({ id: category.id, title: category.name })),
  chapters,
};
await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
const tempPath = fileURLToPath(output) + ".tmp";
await writeFile(tempPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
await rename(tempPath, output);
process.stdout.write(`Saved ${ids.length} duas in ${chapters.length} chapters.\n`);
