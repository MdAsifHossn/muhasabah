import { BookStatus } from "@prisma/client";
import { BookMarked, BookOpen, Plus, Trash2 } from "lucide-react";

import { ToastForm } from "@/components/dashboard/toast-form";
import { EmptyState } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { StatTile } from "@/components/design/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { addReadingLog, createBook, deleteBook, updateBookStatus } from "@/lib/actions/personal";
import { bookStatusLabels } from "@/lib/constants";
import { formatBanglaDate } from "@/lib/dates";
import { requireUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const statusVariant = { PLANNED: "secondary", READING: "info", COMPLETED: "soft", PAUSED: "warning" } as const;

export default async function BooksPage() {
  const session = await requireUser();
  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: [{ updatedAt: "desc" }],
    include: { readingLogs: { orderBy: { date: "desc" } } },
  });
  const totalPages = books.reduce((sum, book) => sum + book.readingLogs.reduce((s, log) => s + log.pagesRead, 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="পাঠচক্র" title="দ্বীনি বই" description="পাঠরত বই ও প্রতিদিনের পড়ার অগ্রগতি সংরক্ষণ করুন।" />

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="মোট বই" value={books.length} icon={BookOpen} />
        <StatTile label="পড়ছি" value={books.filter((b) => b.status === BookStatus.READING).length} />
        <StatTile label="মোট পৃষ্ঠা" value={totalPages} tone="gold" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="order-2 space-y-4 lg:order-1">
          {books.length === 0 ? (
            <EmptyState icon={BookMarked} title="এখনো কোনো বই যোগ করা হয়নি" description="নতুন বই ফর্ম থেকে প্রথম বইটি যোগ করুন।" />
          ) : (
            books.map((book) => {
              const pages = book.readingLogs.reduce((sum, log) => sum + log.pagesRead, 0);
              const percent = book.totalPages ? Math.min(Math.round((pages / book.totalPages) * 100), 100) : null;
              return (
                <Card key={book.id}>
                  <CardContent className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="font-bold leading-6 text-foreground">{book.title}</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {book.author || "লেখক উল্লেখ নেই"}
                          {book.publisher ? ` • ${book.publisher}` : ""}
                        </p>
                      </div>
                      <Badge variant={statusVariant[book.status]}>{bookStatusLabels[book.status]}</Badge>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          পড়া হয়েছে <b className="text-foreground">{pages}</b>
                          {book.totalPages ? ` / ${book.totalPages}` : ""} পৃষ্ঠা
                        </span>
                        {percent !== null ? <span className="font-bold text-primary">{percent}%</span> : null}
                      </div>
                      {percent !== null ? (
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                      ) : null}
                    </div>

                    <ToastForm action={addReadingLog} successMessage="পাঠ যোগ হয়েছে।" className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-surface-sunken p-3 sm:grid-cols-[120px_1fr_auto]">
                      <input type="hidden" name="bookId" value={book.id} />
                      <Input name="pagesRead" type="number" inputMode="numeric" min="1" required placeholder="পৃষ্ঠা" aria-label="আজ পড়া পৃষ্ঠা" />
                      <Input name="note" placeholder="নোট (ঐচ্ছিক)" aria-label="নোট" className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto" />
                      <Button type="submit" className="col-start-2 row-start-1 sm:col-start-auto">যোগ</Button>
                    </ToastForm>

                    {book.readingLogs.length ? (
                      <p className="text-xs text-subtle-foreground">
                        শেষ পাঠ: {formatBanglaDate(book.readingLogs[0].date)} • {book.readingLogs[0].pagesRead} পৃষ্ঠা
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
                      <ToastForm action={updateBookStatus} successMessage="অবস্থা পরিবর্তন হয়েছে।" className="flex flex-wrap gap-1.5">
                        <input type="hidden" name="bookId" value={book.id} />
                        {Object.values(BookStatus)
                          .filter((status) => status !== book.status)
                          .map((status) => (
                            <Button key={status} type="submit" name="status" value={status} variant="outline" size="sm">
                              {bookStatusLabels[status]}
                            </Button>
                          ))}
                      </ToastForm>
                      <ToastForm action={deleteBook} successMessage="বই মুছে ফেলা হয়েছে।" className="ml-auto">
                        <input type="hidden" name="bookId" value={book.id} />
                        <Button type="submit" variant="ghost" size="icon-sm" aria-label="বই মুছুন" className="text-danger hover:bg-danger-soft hover:text-danger">
                          <Trash2 className="size-4" />
                        </Button>
                      </ToastForm>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="order-1 h-fit lg:sticky lg:top-24 lg:order-2">
          <CardContent>
            <h2 className="flex items-center gap-2 font-bold text-foreground">
              <span className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary">
                <Plus className="size-4" />
              </span>
              নতুন বই
            </h2>
            <ToastForm action={createBook} successMessage="বই যোগ হয়েছে।" className="mt-4 space-y-3">
              <Input name="title" required minLength={2} placeholder="বইয়ের নাম" aria-label="বইয়ের নাম" />
              <div className="grid grid-cols-2 gap-2">
                <Input name="author" placeholder="লেখক" aria-label="লেখক" />
                <Input name="publisher" placeholder="প্রকাশনী" aria-label="প্রকাশনী" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input name="totalPages" type="number" inputMode="numeric" min="1" placeholder="মোট পৃষ্ঠা" aria-label="মোট পৃষ্ঠা" />
                <Select name="status" defaultValue={BookStatus.READING} aria-label="অবস্থা">
                  {Object.values(BookStatus).map((status) => (
                    <option key={status} value={status}>
                      {bookStatusLabels[status]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button className="w-full" type="submit">
                বই যোগ করুন
              </Button>
            </ToastForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
