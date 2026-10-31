import { unstable_cache } from "next/cache";

/**
 * কিতাবখানা — Bangla Islamic books from IslamHouse.com (free, openly
 * licensed for distribution). The API has no search, so the whole Bangla
 * catalogue (~561 small records) is fetched server-side, cached for a day, and
 * searched / sorted in memory.
 *
 * Some raw upstream pages are 2.5–4.5 MB (they embed every translation's
 * metadata), above Next's 2 MB fetch-cache limit — so the raw pages are
 * fetched uncached and the small *normalised* catalogue is what gets cached.
 */

/** IslamHouse's public API key, as published in their API documentation. */
const ISLAMHOUSE_KEY = "paV29H2gm56kvLPy";
const API = `https://api3.islamhouse.com/v3/${ISLAMHOUSE_KEY}/main/books/bn/bn`;
/** Upstream caps a page at 50 items. */
const UPSTREAM_PAGE = 50;
const DAY = 60 * 60 * 24;
/** Per upstream page. The raw catalogue is ~30 MB (each record embeds every
 *  translation's metadata), so pages can be slow; the UI streams a skeleton meanwhile. */
const TIMEOUT_MS = 20000;
const CONCURRENCY = 4;

export const LIBRARY_SOURCE_URL = "https://islamhouse.com/bn/books/";

export type ContributorKind = "author" | "translator" | "reviewer" | "publisher" | "source" | string;

export type LibraryFile = { url: string; ext: string; size: string };

export type LibraryBook = {
  id: number;
  title: string;
  description: string;
  contributors: { name: string; kind: ContributorKind }[];
  cover: string | null;
  files: LibraryFile[];
  addedAt: number;
};

export const KIND_LABELS: Record<string, string> = {
  author: "লেখক",
  translator: "অনুবাদক",
  reviewer: "সম্পাদক",
  publisher: "প্রকাশক",
  source: "উৎস",
};

type UpstreamBook = {
  id: number;
  title?: string;
  description?: string | null;
  image?: string | null;
  add_date?: number;
  prepared_by?: { title?: string; kind?: string }[];
  attachments?: { url?: string; size?: string; extension_type?: string; order?: number }[];
};
type UpstreamPage = { data?: UpstreamBook[]; links?: { pages_number?: number } };

async function fetchPageOnce(page: number): Promise<UpstreamPage> {
  const response = await fetch(`${API}/${page}/${UPSTREAM_PAGE}/json`, {
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`IslamHouse ${response.status}`);
  return (await response.json()) as UpstreamPage;
}

/** One retry — a single slow page should not fail the whole catalogue. */
async function fetchPage(page: number): Promise<UpstreamPage> {
  try {
    return await fetchPageOnce(page);
  } catch {
    return fetchPageOnce(page);
  }
}

/** Runs `task` over `items` with at most `limit` in flight. */
async function mapLimited<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await task(items[index]);
      }
    }),
  );
  return results;
}

function normalize(book: UpstreamBook): LibraryBook {
  const files = (book.attachments ?? [])
    .filter((file) => file.url)
    .sort((a, b) => (a.extension_type === "PDF" ? -1 : 0) - (b.extension_type === "PDF" ? -1 : 0) || (a.order ?? 0) - (b.order ?? 0))
    .map((file) => ({ url: file.url!, ext: (file.extension_type ?? "").toUpperCase(), size: file.size ?? "" }));
  return {
    id: book.id,
    title: (book.title ?? "").trim(),
    description: (book.description ?? "").trim().slice(0, 2400),
    contributors: (book.prepared_by ?? []).filter((person) => person.title).map((person) => ({ name: person.title!.trim(), kind: person.kind ?? "author" })),
    cover: book.image || null,
    files,
    addedAt: (book.add_date ?? 0) * 1000,
  };
}

async function loadCatalogue(): Promise<LibraryBook[]> {
  const first = await fetchPage(1);
  const pages = Math.min(first.links?.pages_number ?? 1, 40);
  // Normalise each page as it arrives so the large raw JSON can be freed early.
  const normalisePage = (page: UpstreamPage) => (page.data ?? []).map(normalize);
  const rest = await mapLimited(
    Array.from({ length: pages - 1 }, (_, index) => index + 2),
    CONCURRENCY,
    async (number) => normalisePage(await fetchPage(number)),
  );
  const seen = new Set<number>();
  const books: LibraryBook[] = [];
  for (const page of [normalisePage(first), ...rest]) {
    for (const book of page) {
      if (seen.has(book.id)) continue;
      seen.add(book.id);
      if (book.title && book.files.length) books.push(book);
    }
  }
  return books.sort((a, b) => b.addedAt - a.addedAt);
}

const cachedCatalogue = unstable_cache(loadCatalogue, ["library-catalogue-bn-v1"], { revalidate: DAY });

/** In-process copy on top of the data cache (warm instances skip even the cache read). */
let memory: { at: number; books: LibraryBook[] } | null = null;

/** Whole Bangla catalogue, newest first, cached for a day. Throws if the source is unreachable. */
export async function getCatalogue(): Promise<LibraryBook[]> {
  if (memory && Date.now() - memory.at < DAY * 1000) return memory.books;
  const books = await cachedCatalogue();
  memory = { at: Date.now(), books };
  return books;
}

export function authorsOf(book: LibraryBook) {
  const authors = book.contributors.filter((person) => person.kind === "author");
  return (authors.length ? authors : book.contributors.filter((person) => person.kind !== "publisher" && person.kind !== "source")).map((person) => person.name);
}

/**
 * Bangla spelling is not standardised (নামাজ / নামায, ঈমান / ইমান …), so search
 * folds common variant letters before comparing.
 */
const fold = (value: string) =>
  value
    .normalize("NFC")
    .toLowerCase()
    .replace(/[ঁ‌‍]/g, "")
    .replace(/ী/g, "ি")
    .replace(/ূ/g, "ু")
    .replace(/ঈ/g, "ই")
    .replace(/ঊ/g, "উ")
    .replace(/য়/g, "য")
    .replace(/য/g, "জ")
    .replace(/[শষ]/g, "স")
    .replace(/ণ/g, "ন")
    .replace(/ৎ/g, "ত")
    .replace(/\s+/g, " ")
    .trim();

/** Same topic, different words — each group matches any of its members. */
const SYNONYMS = [
  ["নামাজ", "সালাত"],
  ["রোজা", "সিয়াম", "সাওম"],
  ["যাকাত"],
  ["হজ", "হজ্জ", "হজ্ব"],
  ["কুরআন", "কোরআন", "কুরান"],
].map((group) => group.map(fold));

function variants(word: string) {
  const folded = fold(word);
  return SYNONYMS.find((group) => group.includes(folded)) ?? [folded];
}

export type LibrarySort = "new" | "name";

export function searchBooks(books: LibraryBook[], query: string, sort: LibrarySort) {
  // Every word must match, in any of its spellings / synonyms.
  const words = query.split(/\s+/).filter(Boolean).map(variants);
  const found = words.length
    ? books.filter((book) => {
        const haystack = fold(`${book.title} ${book.description.slice(0, 300)} ${book.contributors.map((person) => person.name).join(" ")}`);
        return words.every((options) => options.some((option) => haystack.includes(option)));
      })
    : books;
  return sort === "name" ? [...found].sort((a, b) => a.title.localeCompare(b.title, "bn")) : found;
}

/** Card-sized record handed to client components (keeps payloads small). */
export type BookSummary = Pick<LibraryBook, "id" | "title" | "cover"> & { authors: string[]; size: string };

export function toSummary(book: LibraryBook): BookSummary {
  return { id: book.id, title: book.title, cover: book.cover, authors: authorsOf(book), size: book.files[0]?.size ?? "" };
}
