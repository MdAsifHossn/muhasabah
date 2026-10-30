import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HadithBreadcrumb } from "@/components/hadith/breadcrumb";
import { JumpToHadith, SectionList } from "@/components/hadith/library-widgets";
import { bn, getBook, getBookTotal, getSections } from "@/lib/hadith";

type Params = { params: Promise<{ book: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const book = getBook((await params).book);
  return { title: book ? book.nameBn : "হাদীস" };
}

export default async function HadithBookPage({ params }: Params) {
  const book = getBook((await params).book);
  if (!book) notFound();
  const sections = getSections(book.id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <HadithBreadcrumb items={[{ label: book.nameBn }]} />

      <header className="surface overflow-hidden rounded-card">
        <div className="hero-surface px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{book.nameBn}</h1>
              <p className="mt-1 text-sm text-on-hero-muted">
                {book.compilerBn} • {book.nameEn}
              </p>
            </div>
            <p lang="ar" className="arabic-text shrink-0 text-2xl text-on-hero/90">
              {book.nameAr}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{bn(getBookTotal(book.id))} হাদীস</span>
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{bn(sections.length)} কিতাব</span>
            <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">{book.language === "en" ? "আরবি + ইংরেজি" : "আরবি + বাংলা"}</span>
          </div>
        </div>
        <div className="space-y-3 p-4 sm:p-5">
          <p className="text-sm leading-6 text-muted-foreground">{book.description}</p>
          {book.language === "en" ? (
            <p className="rounded-xl bg-info-soft px-3 py-2 text-xs leading-5 text-info">
              এই গ্রন্থের নির্ভরযোগ্য বাংলা অনুবাদ-ডেটা পাওয়া যায়নি; তাই আরবি মূলের সাথে ইংরেজি অনুবাদ দেখানো হচ্ছে।
            </p>
          ) : null}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">হাদীস নম্বর দিয়ে খুঁজুন</p>
            <JumpToHadith bookId={book.id} />
          </div>
        </div>
      </header>

      <section aria-label="কিতাবসমূহ" className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">কিতাবসমূহ</h2>
        <SectionList bookId={book.id} sections={sections} />
      </section>
    </div>
  );
}
