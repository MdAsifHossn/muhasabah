import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/design/page-header";
import { DuaChapterViewer } from "@/components/islamic/dua-chapter-viewer";
import { DUA_BOOKS, DUA_CHAPTERS } from "@/lib/dua-catalog";
import { bnNum } from "@/lib/quran";

type Props = { params: Promise<{ chapterId: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapterId } = await params;
  const chapter = DUA_CHAPTERS.find((entry) => entry.id === chapterId);
  return { title: chapter?.title || "পরিচ্ছেদ পাওয়া যায়নি" };
}
export default async function DuaChapterPage({ params }: Props) {
  const { chapterId } = await params;
  const index = DUA_CHAPTERS.findIndex((entry) => entry.id === chapterId);
  if (index < 0) notFound();
  const chapter = DUA_CHAPTERS[index];
  return <div className="space-y-5"><Link href={`/dua?book=${chapter.bookId}`} className="inline-block text-sm font-semibold text-primary underline underline-offset-4">পরিচ্ছেদের তালিকা</Link><PageHeader eyebrow={DUA_BOOKS.find((book) => book.id === chapter.bookId)?.title || "দোয়া ও যিকির"} title={chapter.title} description={`${bnNum(chapter.duas.length)}টি এন্ট্রি · আরবি, অর্থ ও সূত্র`} /><DuaChapterViewer key={chapter.id} chapter={chapter} /><nav aria-label="পাশের পরিচ্ছেদ" className="dua-no-print flex justify-between gap-3 text-sm font-semibold text-primary">{index > 0 ? <Link href={`/dua/${DUA_CHAPTERS[index - 1].id}`} className="rounded-xl border border-hairline px-3 py-2">আগের পরিচ্ছেদ</Link> : <span />}{index < DUA_CHAPTERS.length - 1 ? <Link href={`/dua/${DUA_CHAPTERS[index + 1].id}`} className="rounded-xl border border-hairline px-3 py-2">পরের পরিচ্ছেদ</Link> : null}</nav></div>;
}
