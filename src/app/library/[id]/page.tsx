import { ArrowLeft, BookOpenText, Download, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SaveBookButton, ShareBookButton } from "@/components/library/book-actions";
import { BookCard } from "@/components/library/book-card";
import { BookCover } from "@/components/library/book-cover";
import { Button } from "@/components/ui/button";
import { toBanglaDigits } from "@/lib/dates";
import { authorsOf, getCatalogue, KIND_LABELS, LIBRARY_SOURCE_URL, toSummary, type LibraryBook } from "@/lib/library";

async function findBook(rawId: string) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) return { book: null, catalogue: [] as LibraryBook[] };
  const catalogue = await getCatalogue();
  return { book: catalogue.find((item) => item.id === id) ?? null, catalogue };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { book } = await findBook((await params).id);
    return book ? { title: `${book.title} — কিতাবখানা`, description: book.description.slice(0, 160) } : { title: "কিতাবখানা" };
  } catch {
    return { title: "কিতাবখানা" };
  }
}

/** Other books by the same author first, then neighbours in the catalogue. */
function suggestions(book: LibraryBook, catalogue: LibraryBook[]) {
  const names = new Set(authorsOf(book));
  const sameAuthor = catalogue.filter((item) => item.id !== book.id && authorsOf(item).some((name) => names.has(name)));
  const index = catalogue.findIndex((item) => item.id === book.id);
  const nearby = [...catalogue.slice(index + 1), ...catalogue.slice(0, index)];
  const picked = new Map<number, LibraryBook>();
  for (const item of [...sameAuthor, ...nearby]) {
    if (picked.size >= 6) break;
    if (item.id !== book.id) picked.set(item.id, item);
  }
  return [...picked.values()];
}

export default async function LibraryBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { book, catalogue } = await findBook((await params).id);
  if (!book) notFound();

  const pdf = book.files.find((file) => file.ext === "PDF") ?? book.files[0];
  const groups = new Map<string, string[]>();
  for (const person of book.contributors) groups.set(person.kind, [...(groups.get(person.kind) ?? []), person.name]);
  const more = suggestions(book, catalogue);

  return (
    <div className="space-y-8">
      <Link href="/library" className="inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> কিতাবখানা
      </Link>

      <article className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8">
        <div className="mx-auto w-44 sm:w-full">
          <BookCover id={book.id} title={book.title} cover={book.cover} large className="shadow-xl" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-snug text-foreground sm:text-3xl">{book.title}</h1>

          {groups.size ? (
            <dl className="mt-4 space-y-1.5 text-sm">
              {[...groups.entries()].map(([kind, names]) => (
                <div key={kind} className="flex gap-2">
                  <dt className="w-20 shrink-0 text-muted-foreground">{KIND_LABELS[kind] ?? kind}</dt>
                  <dd className="min-w-0 font-medium text-foreground">{names.join(", ")}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button asChild size="lg" className="col-span-2 sm:col-span-1">
              <a href={pdf.url} target="_blank" rel="noopener noreferrer">
                <BookOpenText className="size-[18px]" /> পড়ুন
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={pdf.url} download rel="noopener noreferrer">
                <Download className="size-[18px]" /> ডাউনলোড
              </a>
            </Button>
            <SaveBookButton id={book.id} />
            <ShareBookButton title={book.title} className="col-span-2 sm:col-span-1" />
          </div>

          {book.files.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {book.files.map((file) => (
                <li key={file.url}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="size-3.5" /> {file.ext} {file.size ? `• ${toBanglaDigits(file.size)}` : ""}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {book.description ? (
            <section className="mt-6">
              <h2 className="text-sm font-bold text-muted-foreground">বইটি সম্পর্কে</h2>
              <p className="mt-2 whitespace-pre-line font-bangla-serif text-[15px] leading-8 text-foreground/90">{book.description}</p>
            </section>
          ) : null}

          <p className="mt-6 text-xs text-muted-foreground">
            উৎস:{" "}
            <a href={LIBRARY_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
              IslamHouse.com
            </a>
          </p>
        </div>
      </article>

      {more.length ? (
        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground">আরও বই</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            {more.map((item) => (
              <BookCard key={item.id} book={toSummary(item)} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
