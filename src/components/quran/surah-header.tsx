import { BISMILLAH, bnNum, hasBismillahHeader, shortBanglaName, type Surah } from "@/lib/quran";

/** Bismillah in the Indo-Pak orthography (matches the IndoPak Nastaleeq font). */
export const BISMILLAH_INDOPAK = "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ";

/** Decorative opening of a surah: medallion, Arabic + Bangla name, facts, and ONE bismillah. */
export function SurahHeader({ surah, continuedFrom, script = "indopak" }: { surah: Surah; continuedFrom?: number; script?: "indopak" | "uthmani" }) {
  const showBismillah = !continuedFrom && hasBismillahHeader(surah.number);
  return (
    <section
      id={`surah-${surah.number}`}
      className="hero-surface relative scroll-mt-24 overflow-hidden rounded-card px-5 pb-6 pt-5 text-center shadow-raised sm:px-8"
    >
      <div className="flex items-center justify-between text-[11px] font-semibold text-on-hero-muted">
        <span className="rounded-full bg-white/10 px-2.5 py-1">সূরা {bnNum(surah.number)}</span>
        <span className="rounded-full bg-white/10 px-2.5 py-1">
          {surah.revelationType === "Meccan" ? "মাক্কী" : "মাদানী"} • {bnNum(surah.numberOfAyahs)} আয়াত
        </span>
      </div>
      <p dir="rtl" className="quran-text mt-3 text-[2.4rem] leading-[1.6] text-amber-100">
        {surah.name}
      </p>
      <h2 className="text-xl font-bold text-on-hero">{shortBanglaName(surah)}</h2>
      <p className="mt-0.5 text-sm text-on-hero-muted">
        {surah.banglaMeaning} • {surah.englishName}
      </p>
      {continuedFrom ? <p className="mt-3 text-xs font-semibold text-amber-200">আয়াত {bnNum(continuedFrom)} থেকে চলমান</p> : null}
      {showBismillah ? (
        <>
          <div className="mx-auto mt-4 flex max-w-xs items-center gap-3 text-amber-200/60" aria-hidden>
            <span className="h-px flex-1 bg-current" />
            <span className="text-xs">✦</span>
            <span className="h-px flex-1 bg-current" />
          </div>
          <p dir="rtl" lang="ar" className="quran-text mt-2 text-[1.75rem] text-on-hero">
            {script === "indopak" ? BISMILLAH_INDOPAK : BISMILLAH}
          </p>
        </>
      ) : null}
    </section>
  );
}
