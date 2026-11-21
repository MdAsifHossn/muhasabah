"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

export const PERFECT_DAY_EVENT = "muhasabah:perfect-day";

/** Fire after a 100% Amalnama is submitted. */
export function celebratePerfectDay() {
  window.dispatchEvent(new Event(PERFECT_DAY_EVENT));
}

const SPARKS = Array.from({ length: 14 }, (_, index) => index);

/**
 * Full-screen "মাশাআল্লাহ" moment when every amal of the day is done. Mounted
 * outside the (re-keyed) daily form so it survives the post-save refresh.
 */
export function PerfectDayCelebration() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(PERFECT_DAY_EVENT, show);
    return () => window.removeEventListener(PERFECT_DAY_EVENT, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="perfect-day-title" className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="celebrate-pop hero-surface relative w-full max-w-sm overflow-hidden rounded-[1.75rem] px-6 pb-6 pt-8 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={() => setOpen(false)} aria-label="বন্ধ করুন" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full text-on-hero-muted hover:bg-white/10">
          <X className="size-5" />
        </button>

        <div className="relative mx-auto grid size-28 place-items-center">
          {SPARKS.map((index) => (
            <span
              key={index}
              className="celebrate-spark absolute left-1/2 top-1/2 size-2 rounded-full bg-marble-300"
              style={{ "--angle": `${(360 / SPARKS.length) * index}deg`, animationDelay: `${(index % 4) * 60}ms` } as React.CSSProperties}
              aria-hidden
            />
          ))}
          <svg viewBox="0 0 100 100" className="celebrate-star size-24 drop-shadow-[0_0_18px_rgba(252,211,77,0.55)]" aria-hidden>
            <g fill="#f4f1ea" fillOpacity="0.18" stroke="#f4f1ea" strokeWidth="4" strokeLinejoin="round">
              <rect x="22" y="22" width="56" height="56" rx="3" />
              <rect x="22" y="22" width="56" height="56" rx="3" transform="rotate(45 50 50)" />
            </g>
            <path d="M38 51l8 8 16-18" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold tracking-wide text-marble-200">
          <Sparkles className="size-4" /> ১০০% সম্পন্ন
        </p>
        <h2 id="perfect-day-title" className="mt-1 text-2xl font-bold text-on-hero">মাশাআল্লাহ!</h2>
        <p className="mt-1 text-sm leading-6 text-on-hero-muted">আজকের সব আমল পূর্ণ হয়েছে। আল্লাহ কবুল করুন এবং ধারাবাহিকতা দান করুন।</p>

        <p lang="ar" dir="rtl" className="arabic-text mt-4 text-xl text-on-hero">إِنَّ اللّٰهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ</p>
        <p className="mt-1 text-xs text-on-hero-muted">নিশ্চয়ই আল্লাহ সৎকর্মশীলদের প্রতিদান নষ্ট করেন না। — সূরা তাওবা ১২০</p>

        <button type="button" onClick={() => setOpen(false)} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-marble-300 text-sm font-bold text-[#0b3b40] transition hover:brightness-105 active:scale-[0.98]">
          আলহামদুলিল্লাহ
        </button>
      </div>
    </div>
  );
}
