import { BookOpen, BookMarked, Plus } from "lucide-react";
import { BookStatus } from "@prisma/client";

import { StatusBadge, inputClass } from "@/components/dashboard/common";
import { CardSection } from "@/components/design/card-section";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { addReadingLog, createBook } from "@/lib/actions/personal";
import { bookStatusLabels } from "@/lib/constants";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function BooksPage() {
  const session = await requireUser();
  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { readingLogs: { orderBy: { date: "desc" } } },
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="পাঠচক্র"
        title="দ্বীনি বই"
        description="পাঠরত বই ও প্রতিদিনের পড়ার অগ্রগতি সংরক্ষণ করুন।"
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 shadow-xs">
            <BookOpen className="size-3.5 text-emerald-700" aria-hidden />
            {books.length}টি বই
          </span>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:gap-6">
        <div>
          {books.length === 0 ? (
            <EmptyState
              icon={BookMarked}
              title="এখনো কোনো বই যোগ করা হয়নি"
              description="পাশের form থেকে প্রথম বইটি যোগ করুন।"
            />
          ) : (
            <div className="space-y-4">
              {books.map((book) => {
                const pages = book.readingLogs.reduce((sum, log) => sum + log.pagesRead, 0);
                const percent = book.totalPages
                  ? Math.min(Math.round((pages / book.totalPages) * 100), 100)
                  : null;

                return (
                  <CardSection
                    key={book.id}
                    title={
                      <span className="inline-flex items-center gap-2">
                        <BookOpen className="size-4 shrink-0 text-emerald-700" aria-hidden />
                        {book.title}
                      </span>
                    }
                    description={`${book.author || "লেখক উল্লেখ নেই"}${book.publisher ? ` • ${book.publisher}` : ""}`}
                    action={
                      <StatusBadge tone={book.status === BookStatus.COMPLETED ? "green" : "neutral"}>
                        {bookStatusLabels[book.status]}
                      </StatusBadge>
                    }
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-stone-600">
                        মোট পড়া: <b className="font-bold text-emerald-950">{pages} পৃষ্ঠা</b>
                      </span>
                      {percent !== null ? (
                        <span className="font-bold text-emerald-800">{percent}%</span>
                      ) : null}
                    </div>
                    {percent !== null ? (
                      <div
                        className="mt-2.5 h-2 overflow-hidden rounded-full bg-surface-sunken"
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="পড়ার অগ্রগতি"
                      >
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-[width] duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    ) : null}

                    <form
                      action={addReadingLog}
                      className="mt-5 grid gap-3 rounded-2xl bg-surface-sunken p-4 sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <input type="hidden" name="bookId" value={book.id} />
                      <input
                        name="pagesRead"
                        type="number"
                        min="1"
                        required
                        placeholder="আজ পড়া পৃষ্ঠা"
                        className={inputClass}
                      />
                      <input name="note" placeholder="সংক্ষিপ্ত নোট" className={inputClass} />
                      <Button type="submit" size="sm">
                        Log যোগ করুন
                      </Button>
                    </form>
                  </CardSection>
                );
              })}
            </div>
          )}
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardContent>
            <h2 className="flex items-center gap-2 text-base font-bold text-emerald-950 sm:text-lg">
              <span className="grid size-8 place-items-center rounded-full bg-surface-sunken text-emerald-700">
                <Plus className="size-4" aria-hidden />
              </span>
              নতুন বই
            </h2>
            <form action={createBook} className="mt-5 space-y-4">
              <input name="title" required placeholder="বইয়ের নাম" className={inputClass} />
              <input name="author" placeholder="লেখক" className={inputClass} />
              <input name="publisher" placeholder="প্রকাশনী" className={inputClass} />
              <input name="totalPages" type="number" min="1" placeholder="মোট পৃষ্ঠা" className={inputClass} />
              <select name="status" className={inputClass} defaultValue={BookStatus.PLANNED}>
                {Object.values(BookStatus).map((status) => (
                  <option key={status} value={status}>
                    {bookStatusLabels[status]}
                  </option>
                ))}
              </select>
              <Button className="w-full" type="submit">
                বই যোগ করুন
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
