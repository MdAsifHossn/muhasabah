import { Bookmark, ChevronLeft, ChevronRight, Library, Search, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BookCard } from "@/components/library/book-card";
import { SavedList } from "@/components/library/saved-list";
import { toBanglaDigits } from "@/lib/dates";
import { getCatalogue, LIBRARY_SOURCE_URL, searchBooks, toSummary, type LibrarySort } from "@/lib/library";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "কিতাবখানা", description: "বাংলা ইসলামি বইয়ের পাঠাগার — পড়ুন ও ডাউনলোড করুন।" };

const PER_PAGE = 24;

type Params = { q?: string; sort?: string; page?: string; view?: string };

function href(params: Params, patch: Partial<Params>) {
  const next = { ...params, ...patch };
  const search = new URLSearchParams();
  if (next.q) search.set("q", next.q);
  if (next.sort === "name") search.set("sort", "name");
  if (next.view === "saved") search.set("view", "saved");
  if (next.page && next.page !== "1") search.set("page", next.page);
  const query = search.toString();
  return query ? `/library?${query}` : "/library";
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 80);
  const sort: LibrarySort = params.sort === "name" ? "name" : "new";
  const saved = params.view === "saved";

  // Errors fall through to ./error.tsx (friendly message + retry).
  const catalogue = await getCatalogue();
  const results = searchBooks(catalogue, q, sort);
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const shown = results.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(toSummary);
  const base: Params = { q, sort, view: saved ? "saved" : undefined };

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <section className="hero-surface relative overflow-hidden rounded-[1.5rem] px-5 py-7 sm:px-8 sm:py-9">
        <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-on-hero-muted">
          <Library className="size-4" /> বাংলা ইসলামি পাঠাগার
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">কিতাবখানা</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-on-hero-muted">
          তাফসীর, হাদীস, আকীদা, ফিকহ ও সীরাতের {toBanglaDigits(catalogue.length)}টি বই — পড়ুন ও ডাউনলোড করুন।
        </p>

        <form action="/library" method="get" role="search" className="mt-5 flex gap-2">
          {sort === "name" ? <input type="hidden" name="sort" value="name" /> : null}
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">বই বা লেখক খুঁজুন</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-white/70" />
            <input
              name="q"
              defaultValue={q}
              type="search"
              placeholder="বইয়ের নাম বা লেখক…"
              className="h-12 w-full rounded-xl border border-white/25 bg-white/10 pl-11 pr-3 text-base text-white outline-none placeholder:text-white/60 focus-visible:border-white/60 focus-visible:ring-[3px] focus-visible:ring-white/20"
            />
          </label>
          <button type="submit" className="h-12 shrink-0 rounded-xl bg-[#e3b25a] px-5 text-sm font-bold text-[#2a1d02] transition hover:bg-[#ecc272] active:scale-[0.98]">
            খুঁজুন
          </button>
        </form>
      </section>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          <Link href={href(base, { view: undefined, page: "1" })} className={cn("h-9 rounded-lg px-4 text-sm font-semibold leading-9 transition", !saved ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            সব বই
          </Link>
          <Link href={href(base, { view: "saved", page: "1" })} className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition", saved ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            <Bookmark className="size-4" /> পরে পড়ব
          </Link>
        </div>
        {!saved ? (
          <div className="flex items-center gap-1 text-sm">
            <span className="mr-1 text-muted-foreground">সাজান:</span>
            {(["new", "name"] as const).map((value) => (
              <Link
                key={value}
                href={href(base, { sort: value, page: "1" })}
                className={cn("rounded-lg px-3 py-1.5 font-semibold transition", sort === value ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {value === "new" ? "নতুন" : "নাম"}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {saved ? (
        <SavedList books={catalogue.map(toSummary)} />
      ) : (
        <>
          {q ? (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              “{q}” — {toBanglaDigits(results.length)}টি বই
              <Link href={href({ sort }, {})} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-primary hover:bg-primary-soft">
                <X className="size-3.5" /> মুছুন
              </Link>
            </p>
          ) : null}

          {shown.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {shown.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </ul>
          ) : (
            <div className="surface rounded-card px-5 py-12 text-center">
              <p className="font-semibold text-foreground">কোনো বই পাওয়া যায়নি</p>
              <p className="mt-1 text-sm text-muted-foreground">অন্য শব্দ লিখে খুঁজে দেখুন — যেমন “নামাজ”, “তাফসীর”, “সীরাত”।</p>
            </div>
          )}

          {pages > 1 ? (
            <nav aria-label="পৃষ্ঠা" className="flex items-center justify-center gap-2 pt-2">
              {page > 1 ? (
                <Link href={href(base, { page: String(page - 1) })} className="inline-flex h-11 items-center gap-1 rounded-xl border bg-card px-4 text-sm font-semibold shadow-xs hover:bg-accent">
                  <ChevronLeft className="size-4" /> আগের
                </Link>
              ) : null}
              <span className="px-3 text-sm text-muted-foreground">
                পৃষ্ঠা {toBanglaDigits(page)} / {toBanglaDigits(pages)}
              </span>
              {page < pages ? (
                <Link href={href(base, { page: String(page + 1) })} className="inline-flex h-11 items-center gap-1 rounded-xl border bg-card px-4 text-sm font-semibold shadow-xs hover:bg-accent">
                  পরের <ChevronRight className="size-4" />
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}

      <p className="text-center text-xs text-muted-foreground">
        উৎস:{" "}
        <a href={LIBRARY_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
          IslamHouse.com
        </a>
      </p>
    </div>
  );
}
