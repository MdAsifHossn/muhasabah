import Link from "next/link";

import { SaveBookButton } from "@/components/library/book-actions";
import { BookCover } from "@/components/library/book-cover";
import { toBanglaDigits } from "@/lib/dates";
import type { BookSummary } from "@/lib/library";

/** Grid card: cover, title, author, size, "পরে পড়ব". */
export function BookCard({ book }: { book: BookSummary }) {
  return (
    <li className="group relative">
      <Link href={`/library/${book.id}`} className="block rounded-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30">
        <BookCover id={book.id} title={book.title} cover={book.cover} className="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg" />
        <h3 className="mt-2.5 line-clamp-2 text-[14px] font-semibold leading-snug text-foreground">{book.title}</h3>
        {book.authors.length ? <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{book.authors.join(", ")}</p> : null}
        {book.size ? <p className="mt-0.5 text-[11px] text-subtle-foreground">PDF • {toBanglaDigits(book.size)}</p> : null}
      </Link>
      <SaveBookButton id={book.id} compact className="absolute right-2 top-2" />
    </li>
  );
}
