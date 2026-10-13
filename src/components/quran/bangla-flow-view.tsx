"use client";

import type { FontSize, ReaderAyah } from "@/components/quran/types";
import { BANGLA_SIZE } from "@/components/quran/types";
import { toBn } from "@/lib/quran-progress";
import { cn } from "@/lib/utils";

type Segment = { surahNumber: number; name: string; from: number; to: number };

/** Groups ayahs into Quran pages — the exact same Map<page, ayah[]> MushafView uses. */
function groupByPage(ayahs: ReaderAyah[]) {
  return ayahs.reduce((map, ayah) => {
    const list = map.get(ayah.page) ?? [];
    list.push(ayah);
    map.set(ayah.page, list);
    return map;
  }, new Map<number, ReaderAyah[]>());
}

function pageSegments(pageAyahs: ReaderAyah[]): Segment[] {
  const segments: Segment[] = [];
  for (const ayah of pageAyahs) {
    const last = segments[segments.length - 1];
    if (last && last.surahNumber === ayah.surahNumber) last.to = ayah.numberInSurah;
    else
      segments.push({
        surahNumber: ayah.surahNumber,
        name: ayah.surahName,
        from: ayah.numberInSurah,
        to: ayah.numberInSurah,
      });
  }
  return segments;
}

function segmentLabel(segment: Segment): string {
  return segment.from === segment.to
    ? `${segment.name} আয়াত ${toBn(segment.from)}`
    : `${segment.name} আয়াত ${toBn(segment.from)}–${toBn(segment.to)}`;
}

/**
 * "শুধু বাংলা" — the continuous mushaf-PAGE style Bengali flow (no cards, no
 * one-line-per-ayah rows): one cream page card per Quran page, the translations
 * running as ONE justified column, with a tappable inline ayah-number badge
 * between ayahs that plays that ayah's own audio. Arabic never appears here and
 * the Bengali text is rendered byte-identical to what the API returned.
 * Visual twin of MushafView (same parchment, header, footer, badge styling).
 */
export function BanglaFlowView({
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
  const pages = groupByPage(ayahs);

  return (
    <div className="space-y-6">
      {Array.from(pages.entries()).map(([page, pageAyahs]) => (
        <section
          key={page}
          className="overflow-hidden rounded-2xl border border-[#d8cba9] bg-[#fffdf6] shadow-lg"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-[#e7ddc4] px-4 py-2.5 text-xs font-bold text-[#7c6841]">
            <span className="min-w-0">{pageSegments(pageAyahs).map(segmentLabel).join(" • ")}</span>
            <span className="shrink-0 rounded-full border border-[#e7ddc4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a08c5f]">
              শুধু বাংলা
            </span>
          </div>

          <div
            dir="ltr"
            className={cn(
              "px-4 py-5 text-justify leading-relaxed text-[#1f352d] sm:px-6 sm:py-6",
              BANGLA_SIZE[fontSize],
            )}
          >
            {pageAyahs.map((ayah, index) => {
              const previous = pageAyahs[index - 1];
              const startsSurah = Boolean(previous) && previous.surahNumber !== ayah.surahNumber;
              const active = playing === ayah.number;
              return (
                <span key={ayah.number}>
                  {startsSurah ? (
                    <span className="my-3 block border-t border-dashed border-[#e7ddc4] pt-3 text-center text-sm font-bold text-[#7c6841]">
                      {ayah.surahName}
                    </span>
                  ) : null}
                  {/* Bengali text byte-identical to the API payload — never altered. */}
                  <span
                    data-ayah={ayah.number}
                    className={cn("rounded-sm transition-colors", active ? "bg-amber-100 text-amber-900" : "text-[#1f352d]")}
                  >
                    {ayah.bangla}
                  </span>
                  {/* Inline ayah marker, styled exactly like MushafView's badges. */}
                  <button
                    type="button"
                    onClick={(event) => onPlay(ayah, event.currentTarget)}
                    aria-label={`আয়াত ${ayah.numberInSurah} শুনুন`}
                    aria-pressed={active}
                    className={cn(
                      "mx-1 inline-flex size-7 cursor-pointer items-center justify-center rounded-full border align-middle text-[11px] font-bold transition-colors",
                      active
                        ? "border-emerald-800 bg-emerald-800 text-white"
                        : "border-[#bca978] text-[#7c6841] active:bg-emerald-50 lg:hover:bg-emerald-50",
                    )}
                  >
                    {ayah.numberInSurah.toLocaleString("ar-EG")}
                  </button>{" "}
                </span>
              );
            })}
          </div>

          <div className="border-t border-[#e7ddc4] py-2 text-center text-xs font-bold text-[#7c6841]">
            ﴿ {toBn(page)} ﴾
          </div>
        </section>
      ))}
    </div>
  );
}
