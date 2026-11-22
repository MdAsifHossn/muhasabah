import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { BookOpen, Search } from "lucide-react";
import { PageHeader } from "@/components/design/page-header";
import { DUA_BOOKS, DUA_CATEGORIES, DUA_COUNT, DUA_SOURCE, searchDuaChapters } from "@/lib/dua-catalog";
import { bnNum } from "@/lib/quran";

export const metadata: Metadata = { title: "দোয়া ও যিকির", description: "হিসনুল মুসলিম, কুরআনের দোয়া ও যিকির—আরবি, বাংলা অর্থ, সহায়ক উচ্চারণ ও সূত্রসহ বিষয়ভিত্তিক সংগ্রহ।" };
type Params = Record<string, string | string[] | undefined>;
const first = (value: Params[string]) => typeof value === "string" ? value : "";

export default async function DuaCatalogPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const query = first(params.q).trim().slice(0, 200);
  const book = DUA_BOOKS.some((entry) => String(entry.id) === first(params.book)) ? first(params.book) : "";
  const category = DUA_CATEGORIES.some((entry) => String(entry.id) === first(params.category)) ? first(params.category) : "";
  const filtered = searchDuaChapters({ query, book, category });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 18));
  const page = Math.min(pageCount, Math.max(1, Math.trunc(Number(first(params.page))) || 1));
  const chapters = filtered.slice((page - 1) * 18, page * 18);
  function href(next: { book?: string; category?: string; page?: number }) {
    const search = new URLSearchParams({ ...(query ? { q: query } : {}), ...(book ? { book } : {}), ...(category ? { category } : {}) });
    for (const [key, value] of Object.entries(next)) { if (value) search.set(key, String(value)); else search.delete(key); }
    return `/dua${search.size ? `?${search}` : ""}`;
  }
  return <div className="space-y-5">
    <PageHeader eyebrow="প্রতিদিনের স্মরণ" title="দোয়া ও যিকির" description="দিনের শুরু থেকে রাতের বিশ্রাম—জীবনের নানা মুহূর্তে আল্লাহর স্মরণ। আরবি পাঠ, বাংলা অর্থ ও সূত্র খুঁজে পড়ুন।" />
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-linear-to-br from-primary-soft to-surface p-4"><div><p className="text-lg font-bold text-primary">{bnNum(DUA_COUNT)}টি এন্ট্রি · {bnNum(DUA_BOOKS.length)}টি সংকলন</p><p className="mt-1 text-sm text-muted-foreground">অর্থ, আরবি, উচ্চারণ ও সূত্র দিয়েও খুঁজতে পারবেন</p></div><Link href="/prayer/duas" className="rounded-xl border border-primary/20 px-3 py-2 text-sm font-semibold text-primary">নামাজের ১৪ ধাপ</Link></div>
    <Form key={`${query}:${book}:${category}`} action="/dua" className="space-y-3 rounded-2xl border border-hairline bg-surface p-3 sm:p-4">
      {book ? <input type="hidden" name="book" value={book} /> : null}
      <div className="flex gap-2"><label className="relative block min-w-0 flex-1"><Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><span className="sr-only">দোয়া বা যিকির খুঁজুন</span><input name="q" type="search" defaultValue={query} placeholder="ঘুম, সফর, ক্ষমা, رَبّ…" className="h-11 w-full rounded-xl border border-hairline bg-surface-sunken pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" /></label><button type="submit" className="rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary">খুঁজুন</button></div>
      <div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm text-muted-foreground">বিষয়<select name="category" defaultValue={category} className="h-10 max-w-56 rounded-xl border border-hairline bg-surface px-3 text-foreground"><option value="">সব বিষয়</option>{DUA_CATEGORIES.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>{query || category || book ? <Link href="/dua" className="text-sm text-primary underline underline-offset-4">ফিল্টার মুছুন</Link> : null}</div>
    </Form>
    <nav aria-label="দোয়ার সংকলন" className="flex flex-wrap gap-2"><Link href={href({ book: "", page: 1 })} aria-current={!book ? "page" : undefined} className={`rounded-full px-3 py-2 text-sm font-medium ${!book ? "bg-primary text-on-primary" : "bg-surface text-muted-foreground"}`}>সব সংকলন</Link>{DUA_BOOKS.map((entry) => <Link key={entry.id} href={href({ book: String(entry.id), page: 1 })} aria-current={book === String(entry.id) ? "page" : undefined} className={`rounded-full px-3 py-2 text-sm font-medium ${book === String(entry.id) ? "bg-primary text-on-primary" : "bg-surface text-muted-foreground"}`}>{entry.title}</Link>)}</nav>
    <p role="status" className="text-sm text-muted-foreground">{bnNum(filtered.length)}টি পরিচ্ছেদ{query ? ` · “${query}”` : ""}</p>
    <div className="grid gap-3 sm:grid-cols-2">{chapters.map((chapter) => <Link key={chapter.id} href={`/dua/${chapter.id}`} className="group flex items-start gap-3 rounded-2xl border border-hairline bg-surface p-4 shadow-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><BookOpen className="size-5" /></span><div className="min-w-0"><p className="text-xs text-muted-foreground">{DUA_BOOKS.find((entry) => entry.id === chapter.bookId)?.title} · পরিচ্ছেদ {bnNum(chapter.number)}</p><h2 className="mt-1 text-base font-bold group-hover:text-primary">{chapter.title}</h2><p className="mt-2 text-xs font-semibold text-primary">{bnNum(chapter.duas.length)}টি এন্ট্রি · পড়ুন</p></div></Link>)}</div>
    {!chapters.length ? <p className="rounded-2xl border border-hairline p-6 text-center text-sm text-muted-foreground">কোনো দোয়া মেলেনি। অন্য শব্দ বা বিষয় দিয়ে খুঁজুন।</p> : null}
    {pageCount > 1 ? <nav aria-label="পরিচ্ছেদের পৃষ্ঠা" className="flex items-center justify-center gap-4 text-sm">{page > 1 ? <Link href={href({ page: page - 1 })} className="rounded-xl border border-hairline bg-surface px-3 py-2">আগের পৃষ্ঠা</Link> : null}<span>{bnNum(page)} / {bnNum(pageCount)}</span>{page < pageCount ? <Link href={href({ page: page + 1 })} className="rounded-xl border border-hairline bg-surface px-3 py-2">পরের পৃষ্ঠা</Link> : null}</nav> : null}
    <p className="text-xs leading-relaxed text-muted-foreground">ডেটা: <a href={DUA_SOURCE.url} target="_blank" rel="noreferrer" className="text-primary underline">{DUA_SOURCE.name}</a> · সংরক্ষিত {DUA_SOURCE.retrievedAt}। পরিচ্ছেদ ও এন্ট্রির গণনা সংস্করণভেদে ভিন্ন হতে পারে। <a href="https://www.hadithbd.com/dua/" target="_blank" rel="noreferrer" className="text-primary underline">হাদিসবিডির সংগ্রহ</a></p>
  </div>;
}
