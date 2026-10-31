"use client";

import { ArrowRight, Bookmark, BookOpenText, Hash, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

import { useBookmarks, useLastRead } from "@/components/hadith/use-hadith-storage";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { bn, findSectionByHadith, getBook, getBookTotal, getSection, HADITH_BOOKS, sectionTitle, type HadithSection } from "@/lib/hadith";
import { cn } from "@/lib/utils";

export function sectionHref(book: string, section: number, hadith?: number) {
  return hadith ? `/dashboard/hadith/${book}/${section}?h=${hadith}#h-${hadith}` : `/dashboard/hadith/${book}/${section}`;
}

/** "যেখানে থেমেছিলেন" card on the library home (only when something was read). */
export function ContinueReading() {
  const last = useLastRead();
  const { bookmarks } = useBookmarks();
  const book = last ? getBook(last.book) : undefined;
  const section = last && book ? getSection(book.id, last.section) : undefined;

  if (!book || !section || !last) {
    return bookmarks.length ? <BookmarkShortcut count={bookmarks.length} /> : null;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Link
        href={sectionHref(book.id, section.number, last.number)}
        className="surface group flex items-center gap-4 rounded-card p-4 transition hover:border-hairline-strong active:scale-[0.99]"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
          <BookOpenText className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-primary">যেখানে থেমেছিলেন</span>
          <span className="mt-0.5 block truncate font-bold text-foreground">{book.nameBn}</span>
          <span className="block truncate text-sm text-muted-foreground">
            কিতাব {bn(section.number)}: {sectionTitle(section)}
            {last.number ? ` • হাদীস ${bn(last.number)}` : ""}
          </span>
        </span>
        <ArrowRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </Link>
      {bookmarks.length ? <BookmarkShortcut count={bookmarks.length} /> : null}
    </div>
  );
}

function BookmarkShortcut({ count }: { count: number }) {
  return (
    <Link
      href="/dashboard/hadith/bookmarks"
      className="surface flex items-center gap-3 rounded-card p-4 transition hover:border-hairline-strong active:scale-[0.99]"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold-soft text-gold">
        <Bookmark className="size-6" />
      </span>
      <span>
        <span className="block font-bold text-foreground">সংরক্ষিত হাদীস</span>
        <span className="block text-sm text-muted-foreground">{bn(count)}টি বুকমার্ক</span>
      </span>
    </Link>
  );
}

/**
 * "হাদীস নম্বর দিয়ে খুঁজুন": picks the kitab containing that number and opens
 * it scrolled to the hadith. With `bookId` the book selector is hidden.
 */
export function JumpToHadith({ bookId, className }: { bookId?: string; className?: string }) {
  const router = useRouter();
  const [book, setBook] = useState(bookId ?? "bukhari");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const total = getBookTotal(book);

  function submit(event: FormEvent) {
    event.preventDefault();
    const number = Number(value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit))));
    if (!Number.isInteger(number) || number < 1) return setError("সঠিক হাদীস নম্বর লিখুন।");
    const section = findSectionByHadith(book, number);
    if (!section) return setError(`এই গ্রন্থে ${bn(number)} নম্বর হাদীস পাওয়া যায়নি (সর্বোচ্চ ${bn(total)})।`);
    setError(null);
    router.push(sectionHref(book, section.number, number));
  }

  return (
    <form onSubmit={submit} className={cn("space-y-2", className)}>
      {/* Phones: book on its own row, number + button below. sm+: one row. */}
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:flex">
        {bookId ? null : (
          <Select aria-label="গ্রন্থ" value={book} onChange={(event) => setBook(event.target.value)} className="col-span-2 h-12 min-w-0 sm:col-span-1 sm:flex-1">
            {HADITH_BOOKS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nameBn}
              </option>
            ))}
          </Select>
        )}
        <div className="relative min-w-0 sm:w-40 sm:shrink-0">
          <Hash className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            inputMode="numeric"
            aria-label="হাদীস নম্বর"
            placeholder="নম্বর"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="h-12 pl-9"
          />
        </div>
        <Button type="submit" aria-label="হাদীসে যান" className="h-12 shrink-0 px-6">
          যান
        </Button>
      </div>
      {error ? <p className="text-xs font-medium text-danger">{error}</p> : null}
    </form>
  );
}

/** Searchable kitab list of one book. */
export function SectionList({ bookId, sections }: { bookId: string; sections: HadithSection[] }) {
  const [query, setQuery] = useState("");
  const last = useLastRead();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((section) => `${section.number} ${bn(section.number)} ${section.nameBn ?? ""} ${section.nameEn} ${section.nameAr ?? ""}`.toLowerCase().includes(q));
  }, [query, sections]);

  return (
    <div className="space-y-3">
      {sections.length > 6 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input type="search" placeholder="কিতাবের নাম বা নম্বর খুঁজুন…" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-10" />
        </div>
      ) : null}
      {filtered.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">কোনো কিতাব মেলেনি।</p> : null}
      <ol className="surface divide-y divide-hairline overflow-hidden rounded-card">
        {filtered.map((section) => {
          const current = last?.book === bookId && last.section === section.number;
          const count = section.last - section.first + 1;
          return (
            <li key={section.number}>
              <Link
                href={sectionHref(bookId, section.number)}
                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-sunken active:bg-surface-sunken"
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold tabular-nums", current ? "bg-primary text-on-primary" : "bg-primary-soft text-primary-soft-foreground")}>
                  {bn(section.number)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-6 text-foreground">{sectionTitle(section)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {section.nameBn ? `${section.nameEn} • ` : ""}হাদীস {bn(section.first)}–{bn(section.last)} ({bn(count)}টি)
                  </span>
                </span>
                {section.nameAr ? <span className="arabic-text hidden shrink-0 text-base text-muted-foreground sm:block">{section.nameAr}</span> : null}
                {current ? <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">চলমান</span> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
