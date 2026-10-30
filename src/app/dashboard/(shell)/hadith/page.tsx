import { Bookmark, BookMarked, ChevronRight, Library } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContinueReading, JumpToHadith } from "@/components/hadith/library-widgets";
import { Button } from "@/components/ui/button";
import { BOOK_GROUPS, bn, getBookTotal, getSections, HADITH_BOOKS } from "@/lib/hadith";

export const metadata: Metadata = { title: "হাদীস লাইব্রেরি" };

export default function HadithLibraryPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="hero-surface relative overflow-hidden rounded-card px-5 py-6 shadow-raised sm:px-8 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-on-hero-muted">
              <Library className="size-4" /> হাদীস লাইব্রেরি
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">রাসূলুল্লাহ ﷺ-এর বাণী পড়ুন</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-on-hero-muted">
              কুতুবে সিত্তাহসহ {bn(HADITH_BOOKS.length)}টি গ্রন্থ — আরবি মূল, বাংলা অনুবাদ, হাদীসের মান, বুকমার্ক ও শেয়ার।
            </p>
          </div>
          <p lang="ar" className="arabic-text hidden shrink-0 text-3xl text-on-hero/80 sm:block">
            قَالَ رَسُولُ اللَّهِ ﷺ
          </p>
        </div>
        <div className="mt-5 rounded-2xl bg-black/15 p-3 ring-1 ring-white/10 [&_input]:bg-white/95 [&_input]:text-[#0f1f1a] [&_select]:bg-white/95 [&_select]:text-[#0f1f1a]">
          <p className="mb-2 text-xs font-semibold text-on-hero-muted">হাদীস নম্বর দিয়ে সরাসরি খুঁজুন</p>
          <JumpToHadith />
        </div>
      </section>

      <ContinueReading />

      {BOOK_GROUPS.map((group) => {
        const books = HADITH_BOOKS.filter((book) => book.group === group.id);
        return (
          <section key={group.id} aria-labelledby={`group-${group.id}`} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 id={`group-${group.id}`} className="text-lg font-bold text-foreground">
                  {group.title}
                </h2>
                {group.note ? <p className="text-xs text-muted-foreground">{group.note}</p> : null}
              </div>
              {group.id === "sitta" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/hadith/bookmarks">
                    <Bookmark className="size-4" /> বুকমার্ক
                  </Link>
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/dashboard/hadith/${book.id}`}
                  className="surface group flex gap-4 rounded-card p-4 transition hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-md active:scale-[0.99]"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <BookMarked className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-bold leading-6 text-foreground">{book.nameBn}</span>
                      <span lang="ar" className="arabic-text shrink-0 text-base leading-6 text-muted-foreground">
                        {book.nameAr}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{book.compilerBn}</span>
                    <span className="mt-2 line-clamp-2 block text-sm leading-6 text-muted-foreground">{book.description}</span>
                    <span className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-foreground">{bn(getBookTotal(book.id))} হাদীস</span>
                      <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-foreground">{bn(getSections(book.id).length)} কিতাব</span>
                      {book.language === "en" ? <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-info">ইংরেজি অনুবাদ</span> : null}
                      <ChevronRight className="ml-auto size-4 text-subtle-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
