import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ScrollText, Search } from "lucide-react";
import { PageHeader } from "@/components/design/page-header";
import { DuaChapterBrowser, type ChapterCard } from "@/components/islamic/dua-chapter-browser";
import { Pagination } from "@/components/ui/pagination";
import { DUA_BOOKS, DUA_CATEGORIES, DUA_COUNT, searchDuaChapters } from "@/lib/dua-catalog";
import { bnNum } from "@/lib/quran";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "দোয়া ও যিকির", description: "হিসনুল মুসলিম, কুরআনের দোয়া ও যিকির—আরবি, বাংলা অর্থ, সহায়ক উচ্চারণ ও সূত্রসহ বিষয়ভিত্তিক সংগ্রহ।" };
type Params = Record<string, string | string[] | undefined>;
const first = (value: Params[string]) => typeof value === "string" ? value : "";
const PAGE_SIZE = 18;

export default async function DuaCatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 200);
  const book = DUA_BOOKS.some((entry) => String(entry.id) === first(params.book)) ? first(params.book) : "";
  const category = DUA_CATEGORIES.some((entry) => String(entry.id) === first(params.category)) ? first(params.category) : "";
  const filtered = searchDuaChapters({ query, book, category });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.trunc(Number(first(params.page))) || 1));
  const chapters: ChapterCard[] = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    bookId: chapter.bookId,
    bookTitle: DUA_BOOKS.find((entry) => entry.id === chapter.bookId)?.title ?? "",
    number: chapter.number,
    count: chapter.duas.length,
    category: DUA_CATEGORIES.find((entry) => entry.id === chapter.duas[0]?.categoryIds[0])?.title,
  }));
  function href(next: { book?: string; category?: string; page?: number }) {
    const search = new URLSearchParams({ ...(query ? { q: query } : {}), ...(book ? { book } : {}), ...(category ? { category } : {}) });
    for (const [key, value] of Object.entries(next)) { if (value) search.set(key, String(value)); else search.delete(key); }
    return `/dua${search.size ? `?${search}` : ""}`;
  }
  const bookChip = (active: boolean) => cn("rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors", active ? "bg-active text-on-active shadow-sm" : "border border-hairline bg-surface text-muted-foreground hover:text-foreground");
  const from = (page - 1) * PAGE_SIZE + 1;
  return <div className="space-y-5">
    <PageHeader eyebrow="প্রতিদিনের স্মরণ" title="দোয়া ও যিকির" description="দিনের শুরু থেকে রাতের বিশ্রাম—জীবনের নানা মুহূর্তে আল্লাহর স্মরণ। পরিচ্ছেদে চাপ দিলে আরবি পাঠ, বাংলা অর্থ ও সূত্র পপআপে খুলবে।" />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-linear-to-br from-primary-soft to-surface p-4"><div><p className="text-lg font-bold text-primary">{bnNum(DUA_COUNT)}টি এন্ট্রি · {bnNum(DUA_BOOKS.length)}টি সংকলন</p><p className="mt-1 text-sm text-muted-foreground">অর্থ, আরবি, উচ্চারণ ও সূত্র দিয়েও খুঁজতে পারবেন</p></div><Link href="/prayer/duas" className="inline-flex items-center gap-1.5 rounded-xl bg-active px-3.5 py-2 text-sm font-semibold text-on-active shadow-sm"><ScrollText className="size-4" />নামাজের দু&apos;আ</Link></div>
    <Form key={`${query}:${book}:${category}`} action="/dua" className="space-y-3 rounded-2xl border border-hairline bg-surface p-3 sm:p-4">
      {book ? <input type="hidden" name="book" value={book} /> : null}
      <div className="flex gap-2"><label className="relative block min-w-0 flex-1"><Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><span className="sr-only">দোয়া বা যিকির খুঁজুন</span><input name="q" type="search" defaultValue={query} placeholder="ঘুম, সফর, ক্ষমা, رَبّ…" className="h-11 w-full rounded-xl border border-hairline bg-surface-sunken pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" /></label><button type="submit" className="rounded-xl bg-active px-4 text-sm font-semibold text-on-active">খুঁজুন</button></div>
      <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm text-muted-foreground">বিষয়<select name="category" defaultValue={category} className="h-10 max-w-56 rounded-xl border border-hairline bg-surface px-3 text-foreground"><option value="">সব বিষয়</option>{DUA_CATEGORIES.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>{query || category || book ? <Link href="/dua" className="text-sm text-primary underline underline-offset-4">ফিল্টার মুছুন</Link> : null}</div>
    </Form>
    <nav aria-label="দোয়ার সংকলন" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"><Link href={href({ book: "", page: 1 })} aria-current={!book ? "page" : undefined} className={cn(bookChip(!book), "shrink-0")}>সব সংকলন</Link>{DUA_BOOKS.map((entry) => <Link key={entry.id} href={href({ book: String(entry.id), page: 1 })} aria-current={book === String(entry.id) ? "page" : undefined} className={cn(bookChip(book === String(entry.id)), "shrink-0")}>{entry.title}</Link>)}</nav>
    <p role="status" className="text-sm text-muted-foreground">{bnNum(filtered.length)}টি পরিচ্ছেদ{query ? ` · “${query}”` : ""}</p>
    <DuaChapterBrowser chapters={chapters} allIds={filtered.map((chapter) => chapter.id)} />
    {!chapters.length ? <p className="rounded-2xl border border-hairline p-6 text-center text-sm text-muted-foreground">কোনো দোয়া মেলেনি। অন্য শব্দ বা বিষয় দিয়ে খুঁজুন।</p> : null}
    <Pagination
      page={page}
      total={pageCount}
      pageHref={(p) => href({ page: p })}
      summary={filtered.length ? `${bnNum(from)}–${bnNum(from + chapters.length - 1)} / ${bnNum(filtered.length)}টি পরিচ্ছেদ` : undefined}
    />
    <p className="text-xs leading-relaxed text-muted-foreground">সংকলন: হিসনুল মুসলিম, কুরআনের দোয়া ও বিশেষ যিকর। পরিচ্ছেদ ও এন্ট্রির গণনা সংস্করণভেদে ভিন্ন হতে পারে।</p>
  </div>;
}
