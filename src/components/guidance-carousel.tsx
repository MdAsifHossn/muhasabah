"use client";

import { ChevronLeft, ChevronRight, BookOpen, BookMarked } from "lucide-react";
import { useMemo, useState } from "react";

import { AyahAudioButton } from "@/components/ayah-audio-button";
import {
  DAILY_HADITH_TARGET,
  DAILY_QURAN_TARGET,
  toBnDigits,
  type DailyAyah,
  type DailyHadith,
  type QuranPage,
} from "@/lib/islamic-content";

const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

/**
 * Surah header shown whenever a page (or a mid-page row) opens a new surah.
 * The standalone bismillah line follows the dashboard reader's rule: never for
 * surah 1 (its ayah 1 IS the bismillah) and never for surah 9.
 */
function SurahHeader({
  surahNumber,
  surahName,
  ayahCountInSurah,
  withDivider,
}: {
  surahNumber: number;
  surahName: string;
  ayahCountInSurah: number;
  withDivider: boolean;
}) {
  const showBismillah = surahNumber !== 1 && surahNumber !== 9;
  return (
    <div
      data-surah-start={surahNumber}
      className={`mb-3 rounded-xl bg-emerald-900/5 px-4 py-3 text-center ${
        withDivider
          ? "mt-5 border-t border-dashed border-emerald-300 pt-4"
          : "mt-0"
      }`}
    >
      <div className="flex items-center justify-center gap-3 text-emerald-950">
        <span className="h-px w-6 bg-emerald-300" />
        <span className="text-sm font-black">{surahName}</span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-800">
          {toBnDigits(ayahCountInSurah)} আয়াত
        </span>
        <span className="h-px w-6 bg-emerald-300" />
      </div>
      {showBismillah ? (
        <p
          dir="rtl"
          className="mt-2 font-serif text-lg leading-loose text-emerald-950 sm:text-xl"
        >
          {BISMILLAH}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Independent Qur'an + hadith carousels for the landing page.
 *
 * The Qur'an side is paginated by surah boundary (see `paginateAyahs`), the
 * hadith side is a plain list of `DAILY_HADITH_TARGET` hadiths — the two no
 * longer share an index, so neither can force the other's split points.
 * While the recitation runs, the displayed page follows the audio: every
 * playlist advance moves the carousel to the page holding that ayah.
 */
export function GuidanceCarousel({
  quranPages,
  hadiths,
}: {
  quranPages: QuranPage[];
  hadiths: DailyHadith[];
}) {
  const [quranIndex, setQuranIndex] = useState(0);
  const [hadithIndex, setHadithIndex] = useState(0);
  /** Playlist index (0-based) that is being recited right now, if any. */
  const [activeAyah, setActiveAyah] = useState<number | null>(null);
  const [reciting, setReciting] = useState(false);
  /** Tap-to-play request: every ayah-row tap bumps the nonce. */
  const [seek, setSeek] = useState({ index: 0, nonce: 0 });

  const allAyahs = useMemo(
    () => quranPages.flatMap((candidate) => candidate.ayahs),
    [quranPages],
  );
  const totalAyahs = allAyahs.length || DAILY_QURAN_TARGET;

  const page = quranPages[quranIndex] ?? quranPages[0];
  const hadith = hadiths[hadithIndex] ?? hadiths[0];

  function moveQuran(delta: number) {
    setQuranIndex(
      (current) =>
        (current + delta + quranPages.length) % Math.max(quranPages.length, 1),
    );
  }

  function moveHadith(delta: number) {
    setHadithIndex(
      (current) =>
        (current + delta + hadiths.length) % Math.max(hadiths.length, 1),
    );
  }

  /** Auto-follow: jump the display to the page holding the recited ayah. */
  function handleIndexChange(index: number) {
    setActiveAyah(index);
    const pageIndex = quranPages.findIndex(
      (candidate) =>
        index >= candidate.startIndex &&
        index < candidate.startIndex + candidate.ayahs.length,
    );
    if (pageIndex >= 0) setQuranIndex(pageIndex);
  }

  function playAyah(absoluteIndex: number) {
    setSeek((current) => ({ index: absoluteIndex, nonce: current.nonce + 1 }));
  }

  const firstAyah = page?.ayahs[0];
  const lastAyah = page?.ayahs[page.ayahs.length - 1];
  const crossesSurah =
    firstAyah && lastAyah && firstAyah.surahNumber !== lastAyah.surahNumber;
  const rangeCounter = !firstAyah || !lastAyah
    ? ""
    : crossesSurah
      ? `আয়াত ${toBnDigits(page.startIndex + 1)}–${toBnDigits(page.startIndex + page.ayahs.length)} • ${toBnDigits(totalAyahs)} এর মধ্যে`
      : `আয়াত ${toBnDigits(firstAyah.numberInSurah)}–${toBnDigits(lastAyah.numberInSurah)} • ${toBnDigits(totalAyahs)} এর মধ্যে`;

  const activeAyahData =
    activeAyah !== null ? allAyahs[activeAyah] : undefined;
  const statusLine =
    reciting && activeAyah !== null && activeAyahData
      ? `তিলাওয়াত: আয়াত ${toBnDigits(activeAyah + 1)} / ${toBnDigits(totalAyahs)} • ${activeAyahData.surahName}`
      : null;

  /** One ayah = one row: number badge + RTL Arabic + left-aligned Bengali. */
  function renderAyahRow(targetPage: QuranPage, ayah: DailyAyah, offset: number) {
    const absolute = targetPage.startIndex + offset;
    const previous = targetPage.ayahs[offset - 1];
    const opensSurah =
      ayah.numberInSurah === 1 ||
      (previous !== undefined && previous.surahNumber !== ayah.surahNumber);
    // A boundary inside the page (offset > 0) always gets the dashed divider.
    const withDivider = offset > 0;
    const active = reciting && activeAyah === absolute;
    return (
      <div key={ayah.globalAyah}>
        {opensSurah ? (
          <SurahHeader
            surahNumber={ayah.surahNumber}
            surahName={ayah.surahName}
            ayahCountInSurah={ayah.ayahCountInSurah}
            withDivider={withDivider}
          />
        ) : null}
        <button
          type="button"
          onClick={() => playAyah(absolute)}
          data-ayah-index={absolute}
          data-active={active ? "true" : "false"}
          aria-label={`আয়াত ${ayah.numberInSurah} — এখান থেকে তিলাওয়াত শুরু করুন`}
          className={`block w-full rounded-2xl border px-3 py-2.5 text-left transition-colors ${
            active
              ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300"
              : "border-emerald-100 bg-white/60 hover:bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-1 grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-black transition-colors ${
                active
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-emerald-200 bg-white text-emerald-800"
              }`}
            >
              {toBnDigits(ayah.numberInSurah)}
            </span>
            <p
              dir="rtl"
              className="flex-1 text-right font-serif text-xl leading-[2] text-emerald-950 sm:text-2xl"
            >
              {ayah.arabic}
            </p>
          </div>
          <p className="mt-1 pl-9 text-sm leading-7 text-stone-700 sm:text-base">
            {ayah.bangla}
          </p>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">
          প্রতিদিনের পথনির্দেশ
        </p>
        <h2 className="text-3xl font-black text-emerald-950 sm:text-4xl">
          আজকের কুরআন ও হাদীস অধ্যয়ন
        </h2>
        <p className="mx-auto max-w-xl text-sm leading-7 text-stone-600">
          রমাদান মাসের বাইরে বছরে দুইবার কুরআন সম্পন্ন এবং প্রতিদিন দশটি হাদীস পাঠের লক্ষ্য।
        </p>
      </div>

      {/* Target Badges */}
      <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 shadow-sm">
          <div>
            <p className="text-xs font-bold text-emerald-800">আজকের কুরআন লক্ষ্য</p>
            <p className="text-xs text-emerald-600">রমাদান বাদে বছরে প্রায় ২ খতম</p>
          </div>
          <span className="rounded-xl bg-emerald-900 px-3 py-1.5 text-sm font-black text-white">
            {DAILY_QURAN_TARGET} আয়াত
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3.5 shadow-sm">
          <div>
            <p className="text-xs font-bold text-sky-800">আজকের হাদীস লক্ষ্য</p>
            <p className="text-xs text-sky-600">প্রতিদিনের নির্ধারিত অধ্যয়ন</p>
          </div>
          <span className="rounded-xl bg-sky-900 px-3 py-1.5 text-sm font-black text-white">
            {DAILY_HADITH_TARGET} হাদীস
          </span>
        </div>
      </div>

      {/* 2-COLUMN INDEPENDENT CAROUSELS */}
      <div className="grid gap-8 lg:grid-cols-2 items-stretch">
        {/* ================= QURAN CAROUSEL ================= */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-[#f3f8f5] p-6 shadow-sm sm:p-8">
          <div>
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 gap-y-3 border-b border-emerald-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-emerald-900 text-white shadow-sm">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.15em] text-emerald-800">
                    আল-কুরআন তিলাওয়াত
                  </p>
                  <p className="text-xs text-stone-500 font-medium">
                    অংশ {toBnDigits(quranIndex + 1)} / {toBnDigits(quranPages.length)}
                  </p>
                </div>
              </div>

              {/* Prev / Next controls (display only — the recitation keeps running) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveQuran(-1)}
                  className="grid size-10 place-items-center rounded-full border border-emerald-200 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-300"
                  aria-label="পূর্ববর্তী আয়াত"
                  title="পূর্ববর্তী আয়াত"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveQuran(1)}
                  className="grid size-10 place-items-center rounded-full bg-emerald-900 text-white shadow-sm transition hover:bg-emerald-800"
                  aria-label="পরবর্তী আয়াত"
                  title="পরবর্তী আয়াত"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Audio & Badge */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-[11px] font-bold text-amber-300">
                আল-কুরআন
              </span>
              {page ? (
                <AyahAudioButton
                  audioUrls={page.audioUrls}
                  startIndex={seek.index}
                  seekNonce={seek.nonce}
                  onIndexChange={handleIndexChange}
                  onPlayingChange={setReciting}
                />
              ) : null}
            </div>

            {/* Live recitation status — fixed height so nothing jumps */}
            <div className="mt-3 flex min-h-6 items-center justify-center">
              <span
                className={`max-w-full truncate rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  statusLine
                    ? "bg-amber-100 text-amber-900"
                    : "text-stone-400"
                }`}
                title={statusLine ?? undefined}
              >
                {statusLine ??
                  "শুনার সময় প্রতিটি আয়াত নিজে নিজে দেখানো হবে"}
              </span>
            </div>

            {page ? (
              <div
                className="mt-4 min-h-[220px] space-y-2"
                data-page-index={quranIndex}
                data-page-size={page.ayahs.length}
                data-pages-count={quranPages.length}
              >
                {page.ayahs.map((ayah, offset) =>
                  renderAyahRow(page, ayah, offset),
                )}
              </div>
            ) : null}
          </div>

          {/* Reference & Dots */}
          <div className="mt-6 border-t border-emerald-200/60 pt-4">
            <p className="text-xs font-bold text-emerald-800" data-page-reference>
              {page?.reference}
            </p>
            <p className="mt-0.5 text-[11px] text-stone-500">{rangeCounter}</p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {quranPages.map((candidate, i) => (
                <button
                  key={`${candidate.startIndex}-${i}`}
                  type="button"
                  aria-label={`কুরআন অংশ ${i + 1}`}
                  aria-current={i === quranIndex}
                  onClick={() => setQuranIndex(i)}
                  className="group flex h-10 items-center justify-center px-1.5"
                >
                  <span
                    className={`h-1.5 rounded-full transition-all ${
                      i === quranIndex
                        ? "w-6 bg-emerald-800"
                        : "w-1.5 bg-emerald-200 group-hover:bg-emerald-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= HADITH CAROUSEL ================= */}
        <div className="flex flex-col justify-between rounded-2xl border border-sky-200 bg-[#f4f8fb] p-6 shadow-sm sm:p-8">
          <div>
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 gap-y-3 border-b border-sky-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-sky-900 text-white shadow-sm">
                  <BookMarked className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.15em] text-sky-800">
                    সহীহ হাদীস অধ্যয়ন
                  </p>
                  <p className="text-xs text-stone-500 font-medium">
                    হাদীস {toBnDigits(hadithIndex + 1)} / {toBnDigits(hadiths.length)}
                  </p>
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveHadith(-1)}
                  className="grid size-10 place-items-center rounded-full border border-sky-200 bg-white text-sky-900 shadow-sm transition hover:bg-sky-100 hover:border-sky-300"
                  aria-label="পূর্ববর্তী হাদীস"
                  title="পূর্ববর্তী হাদীস"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveHadith(1)}
                  className="grid size-10 place-items-center rounded-full bg-sky-900 text-white shadow-sm transition hover:bg-sky-800"
                  aria-label="পরবর্তী হাদীস"
                  title="পরবর্তী হাদীস"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Narrator & Badge */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-sky-950 px-3 py-1 text-[11px] font-bold text-sky-200">
                {hadith?.grade || "সহীহ হাদীস"}
              </span>
              {hadith?.narrator ? (
                <span className="text-xs font-semibold text-stone-500">
                  {hadith.narrator}
                </span>
              ) : null}
            </div>

            {/* Hadith Arabic Text */}
            <div className="mt-5 min-h-[110px] flex items-center justify-end">
              <p
                dir="rtl"
                className="w-full line-clamp-4 text-right font-serif text-xl leading-[2] text-slate-900 sm:text-2xl"
              >
                {hadith?.arabic}
              </p>
            </div>

            {/* Translation */}
            <div className="mt-5 border-t border-sky-200/80 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                অনুবাদ
              </p>
              <p className="mt-1 leading-7 text-stone-700 text-sm sm:text-base">
                {hadith?.bangla}
              </p>
            </div>
          </div>

          {/* Reference & Dots */}
          <div className="mt-6 border-t border-sky-200/60 pt-4">
            <p className="text-xs font-bold text-sky-800">
              {hadith?.reference}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {hadiths.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`হাদীস ${i + 1}`}
                  aria-current={i === hadithIndex}
                  onClick={() => setHadithIndex(i)}
                  className="group flex h-10 items-center justify-center px-1.5"
                >
                  <span
                    className={`h-1.5 rounded-full transition-all ${
                      i === hadithIndex
                        ? "w-6 bg-sky-800"
                        : "w-1.5 bg-sky-200 group-hover:bg-sky-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
