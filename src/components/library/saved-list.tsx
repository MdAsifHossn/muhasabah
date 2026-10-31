"use client";

import { Bookmark } from "lucide-react";
import Link from "next/link";

import { BookCard } from "@/components/library/book-card";
import { useSavedBooks } from "@/components/library/saved-books";
import type { BookSummary } from "@/lib/library";

/** "পরে পড়ব" shelf — filters the catalogue by ids saved on this device. */
export function SavedList({ books }: { books: BookSummary[] }) {
  const [saved] = useSavedBooks();
  const byId = new Map(books.map((book) => [book.id, book]));
  const list = saved.map((id) => byId.get(id)).filter((book): book is BookSummary => Boolean(book));

  if (!list.length) {
    return (
      <div className="surface rounded-card px-5 py-12 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-gold-soft text-gold">
          <Bookmark className="size-6" />
        </span>
        <p className="mt-4 font-semibold text-foreground">এখনো কোনো বই রাখা হয়নি</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">বইয়ের কোণার বুকমার্ক চিহ্নে চাপ দিন — বইটি এখানে জমা থাকবে।</p>
        <Link href="/library" className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
          সব বই দেখুন
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {list.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </ul>
  );
}
