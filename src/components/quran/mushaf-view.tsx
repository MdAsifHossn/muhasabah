"use client";

import type { FontSize, ReaderAyah } from "@/components/quran/types";
import { cn } from "@/lib/utils";

const MUSHAF_SIZE: Record<FontSize, string> = {
  small: "text-[22px]",
  medium: "text-2xl",
  large: "text-3xl",
};

/**
 * Page-by-page mushaf rendering. The standalone bismillah line is suppressed
 * for surah 1 (its ayah 1 IS the bismillah) and surah 9 — never shown twice.
 * Tapping an ayah plays that ayah's own audio; there is no progress bar.
 */
export function MushafView({
  ayahs,
  fontSize,
  playing,
  onPlay,
}: {
  ayahs: ReaderAyah[];
  fontSize: FontSize;
  playing: number | null;
  onPlay: (ayah: ReaderAyah, element: HTMLElement) => void;
}) {
  const pages = ayahs.reduce((map, ayah) => {
    const list = map.get(ayah.page) ?? [];
    list.push(ayah);
    map.set(ayah.page, list);
    return map;
  }, new Map<number, ReaderAyah[]>());

  return (
    <div className="space-y-6">
      {Array.from(pages.entries()).map(([page, pageAyahs]) => (
        <section
          key={page}
          className="overflow-hidden rounded-2xl border border-[#d8cba9] bg-[#fffdf6] shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-[#e7ddc4] px-4 py-2.5 text-xs font-bold text-[#7c6841]">
            <span dir="rtl" className="font-serif text-sm">
              القرآن الكريم
            </span>
            <span>পৃষ্ঠা {page.toLocaleString("bn-BD")}</span>
          </div>
          <div dir="rtl" className="px-3 py-5 text-center font-serif leading-[2.65] sm:px-5 sm:py-6">
            {pageAyahs.map((ayah, index) => {
              const startsSurah = index === 0 || pageAyahs[index - 1].surahNumber !== ayah.surahNumber;
              const showBismillah =
                startsSurah && ayah.numberInSurah === 1 && ayah.surahNumber !== 9 && ayah.surahNumber !== 1;
              return (
                <span key={ayah.number}>
                  {showBismillah ? (
                    <span className="mb-4 block text-center text-xl text-emerald-950 sm:text-2xl">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                    </span>
                  ) : null}
                  <button
                    type="button"
                    data-ayah={ayah.number}
                    onClick={(event) => onPlay(ayah, event.currentTarget)}
                    className={cn(
                      "inline cursor-pointer rounded-lg px-1 py-0.5 align-baseline transition-colors",
                      MUSHAF_SIZE[fontSize],
                      playing === ayah.number
                        ? "bg-amber-100 text-amber-900"
                        : "text-[#1f352d] active:bg-emerald-50 lg:hover:bg-emerald-50",
                    )}
                  >
                    {ayah.arabic}
                    <span
                      className={cn(
                        "mx-1 inline-flex size-7 items-center justify-center rounded-full border align-middle text-[11px] font-bold",
                        playing === ayah.number
                          ? "border-emerald-800 bg-emerald-800 text-white"
                          : "border-[#bca978] text-[#7c6841]",
                      )}
                    >
                      {ayah.numberInSurah.toLocaleString("ar-EG")}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
          <div className="border-t border-[#e7ddc4] py-2 text-center text-xs font-bold text-[#7c6841]">
            ﴿ {page.toLocaleString("bn-BD")} ﴾
          </div>
        </section>
      ))}
    </div>
  );
}
