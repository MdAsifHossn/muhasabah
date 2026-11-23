import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { NamesOfAllahViewer } from "../src/components/islamic/names-of-allah-viewer";
import { SalatDuasViewer } from "../src/components/prayer/salat-duas-viewer";
import { ASMAUL_HUSNA } from "../src/lib/asmaul-husna";
import { SALAT_DUAS, SALAT_STAGES } from "../src/lib/salat-duas";
import NamesRedirect from "../src/app/dashboard/(shell)/names-of-allah/page";
import DuasRedirect from "../src/app/dashboard/(shell)/prayer/duas/page";
import { getNameDetails } from "../src/lib/asmaul-husna-details";
import { DUA_BOOKS, DUA_CATEGORIES, DUA_CHAPTERS, DUA_COUNT, searchDuaChapters } from "../src/lib/dua-catalog";
import { formatCatalogDua } from "../src/lib/dua-format";
import { normalizeIslamicSearch } from "../src/lib/islamic-search";
import { filterMahramRelations, MAHRAM_RELATIONS, MAHRAM_SOURCES } from "../src/lib/mahrams";
import { MahramsViewer } from "../src/components/islamic/mahrams-viewer";
import { DuaChapterViewer } from "../src/components/islamic/dua-chapter-viewer";
import ChapterPage, { generateMetadata } from "../src/app/dua/[chapterId]/page";

test("99 names have unique, consecutive IDs and complete display fields", () => {
  assert.deepEqual(ASMAUL_HUSNA.map((name) => name.id), Array.from({ length: 99 }, (_, i) => i + 1));
  assert.equal(new Set(ASMAUL_HUSNA.map((name) => name.arabic)).size, 99);
  for (const name of ASMAUL_HUSNA) {
    for (const field of [name.arabic, name.bangla, name.meaning, name.explanation, name.category]) {
      assert.ok(field.trim());
    }
  }
});

test("prayer guide has many ordered, complete steps with reference labels", () => {
  assert.ok(SALAT_DUAS.length >= 35);
  assert.deepEqual(SALAT_DUAS.map((dua) => dua.step), Array.from({ length: SALAT_DUAS.length }, (_, i) => i + 1));
  assert.ok(SALAT_DUAS.every((dua) => (SALAT_STAGES as readonly string[]).includes(dua.stage)));
  for (const dua of SALAT_DUAS) {
    for (const field of [dua.title, dua.stage, dua.location, dua.arabic, dua.meaning, dua.reference]) {
      assert.ok(field.trim());
    }
  }
});

test("names render as compact keyboard-operable cards with theme-colored Arabic", () => {
  const html = renderToStaticMarkup(<NamesOfAllahViewer />);
  assert.equal((html.match(/<button[^>]*class="group relative/g) ?? []).length, 99);
  assert.ok(!html.includes("min-h-[10rem]"));
  assert.ok(!html.includes("min-h-[12rem]"));
  assert.equal((html.match(/quran-text break-words[^"]*text-(cat-|warning|info|success)/g) ?? []).length, 99);
  assert.ok(!/href="https?:/.test(html), "names page must not link to other sites");
});

test("each name has pronunciation, an original study prompt, and valid reference metadata", () => {
  for (const name of ASMAUL_HUSNA) {
    const details = getNameDetails(name.id);
    assert.ok(details.transliteration.trim());
    assert.ok(details.reflection.trim());
    if (details.evidence) {
      assert.match(details.evidence.label, /^আল-কুরআন \d+:\d+$/);
      assert.ok(!("url" in details.evidence));
      assert.ok(["name", "attribute"].includes(details.evidence.kind));
    }
  }
  assert.throws(() => getNameDetails(0), RangeError);
  assert.throws(() => getNameDetails(100), RangeError);
});

test("prayer duas render as cards grouped by stage and keep the full guide printable", () => {
  const html = renderToStaticMarkup(<SalatDuasViewer />);
  assert.match(html, /<h2[^>]*>নামাজ<\/h2>/);
  assert.equal((html.match(/<button[^>]*class="group relative/g) ?? []).length, SALAT_DUAS.length);
  for (const dua of SALAT_DUAS) {
    assert.ok(html.includes(dua.arabic));
    assert.ok(html.includes(dua.meaning.replaceAll("'", "&#x27;")));
  }
  assert.match(html, /\.print-only\s*\{\s*display: block !important;/);
});

test("legacy page components redirect to the public guides", () => {
  for (const [page, target] of [[NamesRedirect, "/names-of-allah"], [DuasRedirect, "/prayer/duas"]] as const) {
    assert.throws(page, (error: unknown) => {
      assert.ok(error instanceof Error && "digest" in error);
      assert.equal(error.digest, `NEXT_REDIRECT;replace;${target};307;`);
      return true;
    });
  }
});

test("bundled dua catalog matches source book totals and has stable unique IDs", () => {
  assert.equal(DUA_COUNT, 421);
  assert.equal(DUA_CHAPTERS.length, 219);
  assert.equal(new Set(DUA_CHAPTERS.map((chapter) => chapter.id)).size, DUA_CHAPTERS.length);
  const ids = DUA_CHAPTERS.flatMap((chapter) => chapter.duas.map((dua) => dua.id));
  assert.equal(new Set(ids).size, DUA_COUNT);
  const categories = new Set(DUA_CATEGORIES.map((category) => category.id));
  for (const book of DUA_BOOKS) {
    const chapters = DUA_CHAPTERS.filter((chapter) => chapter.bookId === book.id);
    assert.equal(chapters.length, book.chapterCount);
    assert.equal(chapters.reduce((sum, chapter) => sum + chapter.duas.length, 0), book.duaCount);
  }
  for (const chapter of DUA_CHAPTERS) {
    assert.ok(chapter.title.trim());
    for (const dua of chapter.duas) {
      assert.ok(dua.title.trim());
      assert.ok(dua.segments.length);
      assert.ok(dua.categoryIds.every((id) => categories.has(id)));
      assert.ok(dua.segments.some((segment) => segment.arabic || segment.introduction || segment.note));
    }
  }
});

test("search ignores Arabic vowels, accepts Bengali digits, and composes catalog filters", () => {
  assert.equal(normalizeIslamicSearch("الرَّحْمَٰنُ ৯৯"), normalizeIslamicSearch("الرحمن 99"));
  assert.equal(searchDuaChapters().length, 219);
  assert.equal(searchDuaChapters({ book: "1" }).length, 133);
  const results = searchDuaChapters({ query: "الحمد لله", book: "1", category: "1" });
  assert.ok(results.length);
  assert.ok(results.every((chapter) => chapter.bookId === 1 && chapter.duas.some((dua) => dua.categoryIds.includes(1))));
  assert.deepEqual(searchDuaChapters({ query: "no-such-dua-999999" }), []);
  assert.deepEqual(searchDuaChapters({ book: "999" }), []);
});

test("copy includes every segment, pronunciation, original notes and reference labels", () => {
  const chapter = DUA_CHAPTERS.find((entry) => entry.duas.some((dua) => dua.segments.length > 1))!;
  const dua = chapter.duas.find((entry) => entry.segments.length > 1)!;
  const text = formatCatalogDua(dua, chapter.title);
  for (const segment of dua.segments) {
    for (const value of [segment.arabic, segment.meaning, segment.note, segment.reference, segment.pronunciation]) {
      if (value) assert.ok(text.includes(value));
    }
  }
  assert.ok(!/https?:\/\//.test(text), "copied text must not reference other sites");
});

test("chapter markup shows every dua in full without external links", () => {
  const chapter = DUA_CHAPTERS[0];
  const html = renderToStaticMarkup(<DuaChapterViewer chapter={chapter} />);
  assert.equal((html.match(/class="catalog-dua /g) ?? []).length, chapter.duas.length);
  for (const dua of chapter.duas) assert.ok(html.includes(dua.title.replaceAll("'", "&#x27;")));
  assert.ok(!/href="https?:/.test(html));
  assert.match(html, /\.catalog-dua-content\s*\{\s*display:block!important/);
});

test("chapter route metadata resolves real titles and invalid chapters return not-found", async () => {
  const chapter = DUA_CHAPTERS[0];
  assert.equal((await generateMetadata({ params: Promise.resolve({ chapterId: chapter.id }) })).title, chapter.title);
  await assert.rejects(() => ChapterPage({ params: Promise.resolve({ chapterId: "999-999" }) }), (error: unknown) => {
    assert.ok(error instanceof Error && "digest" in error);
    assert.equal(error.digest, "NEXT_HTTP_ERROR_FALLBACK;404");
    return true;
  });
});

test("mahram filters distinguish spouses, conditional step-relations, cousins and in-laws", () => {
  assert.equal(new Set(MAHRAM_RELATIONS.map((entry) => entry.id)).size, MAHRAM_RELATIONS.length);
  for (const audience of ["men", "women"] as const) {
    assert.equal(filterMahramRelations(audience, "spouse", "").length, 1);
    assert.equal(filterMahramRelations(audience, "conditional", "").length, 1);
    assert.ok(filterMahramRelations(audience, "non-mahram", "চাচাতো").length > 0);
    assert.ok(filterMahramRelations(audience, "mahram", "দুধ").every((entry) => entry.note));
    assert.equal(filterMahramRelations(audience, "all", "not-a-relation").length, 0);
  }
  assert.equal(filterMahramRelations("women", "non-mahram", "দেবর").length, 1);
  assert.equal(filterMahramRelations("men", "non-mahram", "ভাবী").length, 2);
  assert.ok(MAHRAM_RELATIONS.every((entry) => MAHRAM_SOURCES.some((source) => source.id === entry.source)));
  const html = renderToStaticMarkup(<MahramsViewer />);
  assert.ok(html.includes("শর্তসাপেক্ষ"));
  assert.ok(html.includes("স্থায়ীভাবে নিষিদ্ধ"));
  assert.ok(!/href="https?:/.test(html), "mahram page must not link to other sites");
  assert.ok(!html.includes("hadithbd"));
});
