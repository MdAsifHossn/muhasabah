import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HadithBreadcrumb } from "@/components/hadith/breadcrumb";
import { fetchHadithSection } from "@/components/hadith/hadith-source";
import { HadithCard, ReaderToolbar, ReadingTracker } from "@/components/hadith/reader";
import { EmptyState } from "@/components/design/empty-state";
import { bn, getBook, getSection, getSections, PAGE_SIZE, sectionTitle } from "@/lib/hadith";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ book: string; section: string }>;
  searchParams: Promise<{ p?: string; h?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { book: bookId, section } = await params;
  const book = getBook(bookId);
  const meta = book ? getSection(book.id, Number(section)) : undefined;
  return { title: book && meta ? `${sectionTitle(meta)} — ${book.nameBn}` : "হাদীস" };
}

export default async function HadithSectionPage({ params, searchParams }: Props) {
  const { book: bookId, section: sectionParam } = await params;
  const query = await searchParams;
  const book = getBook(bookId);
  const sectionNumber = Number(sectionParam);
  const section = book ? getSection(book.id, sectionNumber) : undefined;
  if (!book || !section) notFound();

  const payload = await fetchHadithSection(book.id, section.number);
  const hadiths = payload.hadiths;
  const pages = Math.max(1, Math.ceil(hadiths.length / PAGE_SIZE));
  // ?h=245 opens the page that contains hadith 245; otherwise ?p=N.
  const targetIndex = query.h ? hadiths.findIndex((hadith) => hadith.number === Number(query.h)) : -1;
  const requested = targetIndex >= 0 ? Math.floor(targetIndex / PAGE_SIZE) + 1 : Number(query.p) || 1;
  const page = Math.min(Math.max(1, requested), pages);
  const visible = hadiths.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const all = getSections(book.id);
  const index = all.findIndex((item) => item.number === section.number);
  const prev = all[index - 1];
  const next = all[index + 1];
  const base = `/dashboard/hadith/${book.id}/${section.number}`;
  const cardBook = { id: book.id, nameBn: book.nameBn, allSahih: book.allSahih };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <HadithBreadcrumb items={[{ label: book.nameBn, href: `/dashboard/hadith/${book.id}` }, { label: `কিতাব ${bn(section.number)}` }]} />

      <header className="space-y-1">
        <p className="text-xs font-bold text-primary">
          {book.nameBn} • কিতাব {bn(section.number)}
        </p>
        <h1 className="text-[1.6rem] font-bold leading-tight text-foreground sm:text-3xl">{sectionTitle(section)}</h1>
        <p className="text-sm text-muted-foreground">
          {section.nameBn ? `${section.nameEn} • ` : ""}হাদীস {bn(section.first)}–{bn(section.last)} • মোট {bn(hadiths.length)}টি
        </p>
        {section.nameAr ? (
          <p lang="ar" className="arabic-text text-xl text-muted-foreground">
            {section.nameAr}
          </p>
        ) : null}
      </header>

      <ReaderToolbar language={payload.language} />

      {visible.length === 0 ? (
        <EmptyState title="এই কিতাবে কোনো হাদীস পাওয়া যায়নি" description="উৎসে এই অংশের তথ্য নেই। অন্য কিতাব দেখুন।" />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {visible.map((hadith) => (
            <HadithCard key={hadith.number} hadith={hadith} book={cardBook} section={section.number} language={payload.language} />
          ))}
        </div>
      )}

      {pages > 1 ? <Pagination base={base} page={page} pages={pages} /> : null}

      <nav aria-label="কিতাব নেভিগেশন" className="grid grid-cols-2 gap-3 pt-2">
        {prev ? (
          <Link href={`/dashboard/hadith/${book.id}/${prev.number}`} className="surface flex min-w-0 items-center gap-2 rounded-card p-3 transition hover:border-hairline-strong active:scale-[0.99]">
            <ChevronLeft className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-muted-foreground">আগের কিতাব</span>
              <span className="block truncate text-sm font-semibold text-foreground">{sectionTitle(prev)}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/dashboard/hadith/${book.id}/${next.number}`} className="surface flex min-w-0 items-center justify-end gap-2 rounded-card p-3 text-right transition hover:border-hairline-strong active:scale-[0.99]">
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold text-muted-foreground">পরের কিতাব</span>
              <span className="block truncate text-sm font-semibold text-foreground">{sectionTitle(next)}</span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
          </Link>
        ) : null}
      </nav>

      <ReadingTracker book={book.id} section={section.number} page={page} />
    </div>
  );
}

function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  const numbers = Array.from({ length: pages }, (_, index) => index + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const linkClass = "grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-semibold transition";
  return (
    <nav aria-label="পৃষ্ঠা" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={`${base}?p=${page - 1}`} aria-label="আগের পৃষ্ঠা" className={cn(linkClass, "border border-hairline bg-surface text-muted-foreground")}>
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {numbers.map((n, index) => (
        <span key={n} className="flex items-center gap-1.5">
          {index > 0 && n - numbers[index - 1] > 1 ? <span className="text-subtle-foreground">…</span> : null}
          <Link
            href={`${base}?p=${n}`}
            aria-current={n === page ? "page" : undefined}
            className={cn(linkClass, n === page ? "bg-primary text-on-primary" : "border border-hairline bg-surface text-foreground hover:bg-surface-sunken")}
          >
            {bn(n)}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={`${base}?p=${page + 1}`} aria-label="পরের পৃষ্ঠা" className={cn(linkClass, "border border-hairline bg-surface text-muted-foreground")}>
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
