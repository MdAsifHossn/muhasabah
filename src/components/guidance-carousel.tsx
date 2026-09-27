"use client";

import { ChevronLeft, ChevronRight, BookOpen, BookMarked } from "lucide-react";
import { useState } from "react";
import { AyahAudioButton } from "@/components/ayah-audio-button";
import { DAILY_HADITH_TARGET, DAILY_QURAN_TARGET, type GuidanceSlide } from "@/lib/islamic-content";

export function GuidanceCarousel({ slides }: { slides: GuidanceSlide[] }) {
  const [quranIndex, setQuranIndex] = useState(0);
  const [hadithIndex, setHadithIndex] = useState(0);

  function moveQuran(delta: number) {
    setQuranIndex((current) => (current + delta + slides.length) % slides.length);
  }

  function moveHadith(delta: number) {
    setHadithIndex((current) => (current + delta + slides.length) % slides.length);
  }

  const quranSlide = slides[quranIndex] ?? slides[0];
  const hadithSlide = slides[hadithIndex] ?? slides[0];

  return (
    <div className="space-y-10">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">
          প্রতিদিনের পথনির্দেশ
        </p>
        <h2 className="text-3xl font-black text-emerald-950 sm:text-4xl">
          আজকের কুরআন ও হাদীস অধ্যয়ন
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
            <p className="text-xs text-emerald-600">রমাদান বাদে বছরে প্রায় ২ খতম</p>
          </div>
          <span className="rounded-xl bg-emerald-900 px-3 py-1.5 text-sm font-black text-white">
            {DAILY_QURAN_TARGET} আয়াত
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3.5 shadow-sm">
          <div>
            <p className="text-xs font-bold text-sky-800">আজকের হাদীস লক্ষ্য</p>
            <p className="text-xs text-sky-600">প্রতিদিনের নির্ধারিত অধ্যয়ন</p>
          </div>
          <span className="rounded-xl bg-sky-900 px-3 py-1.5 text-sm font-black text-white">
            {DAILY_HADITH_TARGET} হাদীস
          </span>
        </div>
      </div>

      {/* 2-COLUMN INDEPENDENT CAROUSELS */}
      <div className="grid gap-8 lg:grid-cols-2 items-stretch">
        {/* ================= QURAN CAROUSEL ================= */}
        <div className="flex flex-col justify-between rounded-[2rem] border border-emerald-200 bg-[#f3f8f5] p-6 shadow-sm sm:p-8">
          <div>
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-4 border-b border-emerald-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-emerald-900 text-white shadow-sm">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.15em] text-emerald-800">
                    আল-কুরআন তিলাওয়াত
                  </p>
                  <p className="text-xs text-stone-500 font-medium">
                    অংশ {quranIndex + 1} / {slides.length}
                  </p>
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveQuran(-1)}
                  className="grid size-9 place-items-center rounded-full border border-emerald-200 bg-white text-emerald-900 shadow-sm transition hover:bg-emerald-100 hover:border-emerald-300"
                  aria-label="পূর্ববর্তী আয়াত"
                  title="পূর্ববর্তী আয়াত"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveQuran(1)}
                  className="grid size-9 place-items-center rounded-full bg-emerald-900 text-white shadow-sm transition hover:bg-emerald-800"
                  aria-label="পরবর্তী আয়াত"
                  title="পরবর্তী আয়াত"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Audio & Badge */}
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-emerald-950 px-3 py-1 text-[11px] font-bold text-amber-300">
                আল-কুরআন
              </span>
              <AyahAudioButton src={quranSlide.ayah.audioUrl} />
            </div>

            {/* Quran Arabic Text */}
            <div className="mt-5 min-h-[110px] flex items-center justify-end">
              <p
                dir="rtl"
                className="w-full text-right font-serif text-2xl leading-[2.2] text-emerald-950 sm:text-3xl"
              >
                {quranSlide.ayah.arabic}
              </p>
            </div>

            {/* Translation */}
            <div className="mt-5 border-t border-emerald-200/80 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                অনুবাদ
              </p>
              <p className="mt-1 leading-7 text-stone-700 text-sm sm:text-base">
                {quranSlide.ayah.bangla}
              </p>
            </div>
          </div>

          {/* Reference & Dots */}
          <div className="mt-6 border-t border-emerald-200/60 pt-4">
            <p className="text-xs font-bold text-emerald-800">
              {quranSlide.ayah.reference}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`কুরআন আয়াত ${i + 1}`}
                  onClick={() => setQuranIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === quranIndex
                      ? "w-6 bg-emerald-800"
                      : "w-1.5 bg-emerald-200 hover:bg-emerald-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ================= HADITH CAROUSEL ================= */}
        <div className="flex flex-col justify-between rounded-[2rem] border border-sky-200 bg-[#f4f8fb] p-6 shadow-sm sm:p-8">
          <div>
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-4 border-b border-sky-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-sky-900 text-white shadow-sm">
                  <BookMarked className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.15em] text-sky-800">
                    সহীহ হাদীস অধ্যয়ন
                  </p>
                  <p className="text-xs text-stone-500 font-medium">
                    হাদীস {hadithIndex + 1} / {slides.length}
                  </p>
                </div>
              </div>

              {/* Prev / Next controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveHadith(-1)}
                  className="grid size-9 place-items-center rounded-full border border-sky-200 bg-white text-sky-900 shadow-sm transition hover:bg-sky-100 hover:border-sky-300"
                  aria-label="পূর্ববর্তী হাদীস"
                  title="পূর্ববর্তী হাদীস"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveHadith(1)}
                  className="grid size-9 place-items-center rounded-full bg-sky-900 text-white shadow-sm transition hover:bg-sky-800"
                  aria-label="পরবর্তী হাদীস"
                  title="পরবর্তী হাদীস"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>

            {/* Narrator & Badge */}
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full bg-sky-950 px-3 py-1 text-[11px] font-bold text-sky-200">
                {hadithSlide.hadith.grade || "সহীহ হাদীস"}
              </span>
              {hadithSlide.hadith.narrator ? (
                <span className="text-xs font-semibold text-stone-500">
                  {hadithSlide.hadith.narrator}
                </span>
              ) : null}
            </div>

            {/* Hadith Arabic Text */}
            <div className="mt-5 min-h-[110px] flex items-center justify-end">
              <p
                dir="rtl"
                className="w-full line-clamp-4 text-right font-serif text-xl leading-[2] text-slate-900 sm:text-2xl"
              >
                {hadithSlide.hadith.arabic}
              </p>
            </div>

            {/* Translation */}
            <div className="mt-5 border-t border-sky-200/80 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
                অনুবাদ
              </p>
              <p className="mt-1 leading-7 text-stone-700 text-sm sm:text-base">
                {hadithSlide.hadith.bangla}
              </p>
            </div>
          </div>

          {/* Reference & Dots */}
          <div className="mt-6 border-t border-sky-200/60 pt-4">
            <p className="text-xs font-bold text-sky-800">
              {hadithSlide.hadith.reference}
            </p>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`হাদীস ${i + 1}`}
                  onClick={() => setHadithIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === hadithIndex
                      ? "w-6 bg-sky-800"
                      : "w-1.5 bg-sky-200 hover:bg-sky-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}