"use client";

import { BookMarked, Check, ChevronLeft, ChevronRight, Copy, Library, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PanelSkeleton } from "@/components/design/empty-state";
import { PageHeader } from "@/components/design/page-header";
import { HADITH_BOOKS, type LiveHadith } from "@/lib/hadith";

type ChapterResponse = LiveHadith[];

export default function HadithPage() {
  const [bookId, setBookId] = useState("bukhari");
  const [chapter, setChapter] = useState(1);
  const [hadiths, setHadiths] = useState<LiveHadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<number | null>(null);

  const book = HADITH_BOOKS.find((b) => b.id === bookId)!;

  useEffect(() => {
    let active = true;
    fetch(
      book.source === "extended"
        ? `/api/hadith/${book.id}/${chapter}`
        : `https://cdn.jsdelivr.net/gh/md-rifatkhan/hadithbangla@main/${book.folder}/Chapter/${chapter}.json`,
    )
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<ChapterResponse>;
      })
      .then((data) => {
        if (active) setHadiths(Array.isArray(data) ? data : []);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [book.folder, book.id, book.source, chapter]);

  const filtered = useMemo(
    () => hadiths.filter((h) => `${h.hadith_id} ${h.narrator} ${h.bn}`.toLowerCase().includes(query.toLowerCase())),
    [hadiths, query],
  );

  async function copy(h: LiveHadith) {
    await navigator.clipboard.writeText(`${h.bn}\n\n— ${book.nameBn}, হাদীস ${h.hadith_id}`);
    setCopied(h.hadith_id);
    setTimeout(() => setCopied(null), 1600);
  }

  function selectBook(id: string) {
    setLoading(true);
    setError(false);
    setBookId(id);
    setChapter(1);
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="বাংলা হাদীস লাইব্রেরি"
        title="১০টি গুরুত্বপূর্ণ হাদীস গ্রন্থ"
        description="আরবি মূলসহ ১০টি গুরুত্বপূর্ণ গ্রন্থ পড়ুন। বাংলা অনুবাদ পাওয়া না গেলে উৎসের English translation স্পষ্টভাবে দেখানো হয়।"
      />

      {/* ── Book picker ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-emerald-950 p-5 text-white shadow-raised sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-300">গ্রন্থ নির্বাচন করুন</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {HADITH_BOOKS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => selectBook(b.id)}
              aria-pressed={bookId === b.id}
              className={`min-h-11 rounded-2xl border p-4 text-left transition ${
                bookId === b.id
                  ? "border-amber-300 bg-amber-400 text-emerald-950 shadow-sm"
                  : "border-emerald-700 bg-emerald-900 hover:border-emerald-400 hover:bg-emerald-800"
              }`}
            >
              <BookMarked className="size-5" aria-hidden />
              <b className="mt-3 block text-sm leading-5">{b.nameBn}</b>
              <small className={bookId === b.id ? "text-emerald-800" : "text-emerald-300"}>
                {b.totalHadith.toLocaleString("bn-BD")} হাদীস
              </small>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[290px_1fr] lg:gap-6">
        {/* ── Chapter sidebar ───────────────────────────────────────── */}
        <aside className="surface h-fit rounded-2xl p-5 lg:sticky lg:top-24">
          <div className="grid size-12 place-items-center rounded-2xl bg-surface-sunken text-emerald-800">
            <Library className="size-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-xl font-bold text-emerald-950">{book.nameBn}</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">{book.description}</p>

          <div className="hairline mt-6 pt-4">
            <label className="text-xs font-bold text-stone-500" htmlFor="hadith-chapter">
              অধ্যায় নম্বর
            </label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={chapter <= 1}
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  setChapter((c) => Math.max(1, c - 1));
                }}
                aria-label="আগের অধ্যায়"
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-hairline bg-white text-stone-600 transition hover:border-emerald-300 hover:text-emerald-800 disabled:opacity-30"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <input
                id="hadith-chapter"
                type="number"
                min="1"
                value={chapter}
                onChange={(e) => {
                  setLoading(true);
                  setError(false);
                  setChapter(Math.max(1, Number(e.target.value) || 1));
                }}
                className="h-11 min-w-0 flex-1 rounded-xl border border-hairline bg-white text-center font-bold outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
              />
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(false);
                  setChapter((c) => c + 1);
                }}
                aria-label="পরের অধ্যায়"
                className="grid size-11 shrink-0 place-items-center rounded-xl border border-hairline bg-white text-stone-600 transition hover:border-emerald-300 hover:text-emerald-800"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="hairline mt-5 pt-4">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-stone-400">অধ্যায়সমূহ</p>
            <div className="no-scrollbar max-h-[420px] space-y-1 overflow-y-auto pr-1">
              {Array.from({ length: book.chapters }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(false);
                    setChapter(number);
                  }}
                  aria-current={chapter === number ? "true" : undefined}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    chapter === number
                      ? "bg-emerald-950 font-semibold text-white"
                      : "text-stone-600 hover:bg-surface-sunken hover:text-emerald-900"
                  }`}
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                      chapter === number ? "bg-amber-300 text-emerald-950" : "bg-surface-sunken text-stone-500"
                    }`}
                  >
                    {number}
                  </span>
                  <span>অধ্যায় {number}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-5 text-stone-400">
            তথ্য: Hadith Bangla এবং pinned open Hadith datasets। উদ্ধৃতির সময় মূল গ্রন্থ যাচাই করুন।
          </p>
        </aside>

        {/* ── Results ───────────────────────────────────────────────── */}
        <section aria-label="হাদীস তালিকা">
          <div className="relative mb-5">
            <Search className="absolute left-4 top-4 size-4 text-stone-400" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="এই অধ্যায়ে শব্দ, রাবি বা হাদীস নম্বর খুঁজুন"
              aria-label="হাদীস অনুসন্ধান"
              className="h-12 w-full rounded-2xl border border-hairline bg-white pl-11 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </div>

          {loading ? (
            <PanelSkeleton count={3} />
          ) : error ? (
            <div className="surface rounded-2xl border border-amber-200 bg-amber-50 px-5 py-10 text-center">
              <b className="text-amber-900">এই অধ্যায়ের তথ্য পাওয়া যায়নি</b>
              <p className="mt-2 text-sm text-amber-800">অধ্যায় নম্বর পরিবর্তন করে আবার চেষ্টা করুন।</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="surface rounded-2xl border-dashed px-5 py-10 text-center text-stone-500">
              কোনো হাদীস মেলেনি।
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {filtered.map((h) => (
                <article key={h.hadith_id} className="surface rounded-2xl p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-white">
                        হাদীস {h.hadith_id}
                      </span>
                      <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-bold text-emerald-800">
                        {h.grade}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(h)}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-surface-sunken px-4 text-xs font-bold text-stone-600 transition hover:bg-emerald-100 hover:text-emerald-900 active:scale-[0.985]"
                    >
                      {copied === h.hadith_id ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                      {copied === h.hadith_id ? "কপি হয়েছে" : "কপি করুন"}
                    </button>
                  </div>

                  <p dir="rtl" className="mt-6 text-right font-serif text-2xl leading-[2.15] text-emerald-950">
                    {h.ar}
                  </p>

                  <div className="hairline mt-5 pt-4">
                    <p className="text-sm font-bold text-emerald-800">রাবি: {h.narrator}</p>
                    <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                      {book.translationLanguage === "bn" ? "বাংলা অনুবাদ" : "English translation"}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-base leading-8 text-stone-700">{h.bn}</p>
                    {h.note ? (
                      <p className="mt-4 rounded-2xl bg-surface-sunken p-4 text-sm leading-7 text-stone-600">
                        টীকা: {h.note}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
