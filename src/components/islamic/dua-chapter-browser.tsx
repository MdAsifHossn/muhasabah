"use client";

import { BookOpen, ChevronLeft, ChevronRight, ExternalLink, Loader2, RotateCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { DuaChapterViewer } from "@/components/islamic/dua-chapter-viewer";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import type { DuaChapter } from "@/lib/dua-catalog";
import { bnNum } from "@/lib/quran";
import { cn } from "@/lib/utils";

export type ChapterCard = { id: string; title: string; bookId: number; bookTitle: string; number: number; count: number; category?: string };

const BOOK_TONES: Record<number, { card: string; medal: string; chip: string; text: string }> = {
  1: { card: "from-cat-salah/18 hover:border-cat-salah/60", medal: "bg-cat-salah text-white", chip: "bg-cat-salah/12 text-cat-salah", text: "text-cat-salah" },
  2: { card: "from-cat-quran/18 hover:border-cat-quran/60", medal: "bg-cat-quran text-white", chip: "bg-cat-quran/12 text-cat-quran", text: "text-cat-quran" },
  3: { card: "from-cat-dhikr/18 hover:border-cat-dhikr/60", medal: "bg-cat-dhikr text-white", chip: "bg-cat-dhikr/12 text-cat-dhikr", text: "text-cat-dhikr" },
};
const FALLBACK_TONE = BOOK_TONES[1];

type Loaded = { chapter: DuaChapter; bookTitle: string };

/** Chapter cards; tapping one opens the full text in a popup instead of navigating away. */
export function DuaChapterBrowser({ chapters, allIds }: { chapters: ChapterCard[]; allIds: string[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!activeId) return;
    const controller = new AbortController();
    fetch(`/api/dua/${encodeURIComponent(activeId)}`, { signal: controller.signal })
      .then((response) => (response.ok ? (response.json() as Promise<Loaded>) : Promise.reject(new Error("bad status"))))
      .then((data) => setLoaded(data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
      });
    return () => controller.abort();
  }, [activeId, attempt]);

  function open(id: string) {
    setLoaded(null);
    setFailed(false);
    setActiveId(id);
  }

  const index = activeId ? allIds.indexOf(activeId) : -1;
  const ready = loaded && loaded.chapter.id === activeId ? loaded : null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => {
          const tone = BOOK_TONES[chapter.bookId] ?? FALLBACK_TONE;
          return (
            <button
              key={chapter.id}
              type="button"
              onClick={() => open(chapter.id)}
              className={cn(
                "group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border border-hairline bg-linear-to-br via-surface to-surface p-4 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                tone.card,
              )}
            >
              <span className="flex items-start gap-3">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl shadow-sm", tone.medal)}><BookOpen className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-medium text-muted-foreground">{chapter.bookTitle} · পরিচ্ছেদ {bnNum(chapter.number)}</span>
                  <span className="mt-0.5 block text-base font-bold leading-snug text-foreground">{chapter.title}</span>
                </span>
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className={cn("rounded-lg px-2.5 py-1 text-[11px] font-semibold", tone.chip)}>{bnNum(chapter.count)}টি এন্ট্রি</span>
                  {chapter.category ? <span className="truncate rounded-lg bg-surface-sunken px-2.5 py-1 text-[11px] font-medium text-muted-foreground">{chapter.category}</span> : null}
                </span>
                <span className={cn("inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold", tone.text)}>
                  পড়ুন <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <ResponsiveSheet
        open={activeId !== null}
        onClose={() => setActiveId(null)}
        title={ready ? ready.chapter.title : "দোয়া ও যিকির"}
        description={ready ? `${ready.bookTitle} · ${bnNum(ready.chapter.duas.length)}টি এন্ট্রি` : undefined}
        className="sm:max-w-2xl"
        footer={
          activeId ? (
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <button type="button" disabled={index <= 0} onClick={() => open(allIds[index - 1])} className="inline-flex items-center gap-1 rounded-xl border border-hairline px-3 py-2 text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground disabled:opacity-40">
                <ChevronLeft className="size-4" /> আগের
              </button>
              <Link href={`/dua/${activeId}`} className="inline-flex items-center gap-1 rounded-xl px-2 py-2 text-primary hover:underline">
                <ExternalLink className="size-3.5" /> আলাদা পাতায় খুলুন
              </Link>
              <button type="button" disabled={index < 0 || index >= allIds.length - 1} onClick={() => open(allIds[index + 1])} className="inline-flex items-center gap-1 rounded-xl border border-hairline px-3 py-2 text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground disabled:opacity-40">
                পরের <ChevronRight className="size-4" />
              </button>
            </div>
          ) : null
        }
      >
        {ready ? (
          <DuaChapterViewer key={ready.chapter.id} chapter={ready.chapter} embedded />
        ) : failed ? (
          <div className="grid place-items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <p>লোড করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</p>
            <button type="button" onClick={() => { setFailed(false); setAttempt((n) => n + 1); }} className="inline-flex items-center gap-1.5 rounded-xl bg-active px-4 py-2 font-semibold text-on-active">
              <RotateCw className="size-4" /> আবার চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div role="status" className="grid place-items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" /> লোড হচ্ছে…
          </div>
        )}
      </ResponsiveSheet>
    </>
  );
}
