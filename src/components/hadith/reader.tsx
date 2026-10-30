"use client";

import { Bookmark, BookmarkCheck, Check, ChevronDown, Copy, Languages, Minus, Plus, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { FONT_SIZES, saveLastRead, useBookmarks, usePrefs } from "@/components/hadith/use-hadith-storage";
import { bn, summarizeGrade, type GradeTone, type HadithEntry } from "@/lib/hadith";
import { cn } from "@/lib/utils";

const gradeClass: Record<GradeTone, string> = {
  sahih: "bg-success-soft text-success",
  hasan: "bg-info-soft text-info",
  daif: "bg-warning-soft text-warning",
  fabricated: "bg-danger-soft text-danger",
  unknown: "bg-surface-sunken text-muted-foreground",
};

/** Sticky reading controls: text size and Arabic on/off (remembered per device). */
export function ReaderToolbar({ language }: { language: "bn" | "en" }) {
  const { prefs, update } = usePrefs();
  return (
    <div className="sticky top-14 z-20 -mx-4 border-b border-hairline bg-background/90 px-4 py-2 backdrop-blur-xl sm:top-16 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => update({ showArabic: !prefs.showArabic })}
          aria-pressed={prefs.showArabic}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition",
            prefs.showArabic ? "border-transparent bg-primary-soft text-primary-soft-foreground" : "border-hairline bg-surface text-muted-foreground",
          )}
        >
          <Languages className="size-4" /> আরবি {prefs.showArabic ? "চালু" : "বন্ধ"}
        </button>
        <span className="hidden text-xs text-muted-foreground sm:block">{language === "en" ? "আরবি মূল • ইংরেজি অনুবাদ" : "আরবি মূল • বাংলা অনুবাদ"}</span>
        <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface p-0.5">
          <button
            type="button"
            aria-label="লেখা ছোট করুন"
            disabled={prefs.fontSize <= 0}
            onClick={() => update({ fontSize: prefs.fontSize - 1 })}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-surface-sunken disabled:opacity-35"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-7 text-center text-xs font-bold text-foreground" aria-live="polite">
            {bn(prefs.fontSize + 1)}
          </span>
          <button
            type="button"
            aria-label="লেখা বড় করুন"
            disabled={prefs.fontSize >= FONT_SIZES.length - 1}
            onClick={() => update({ fontSize: prefs.fontSize + 1 })}
            className="grid size-8 place-items-center rounded-md text-muted-foreground transition hover:bg-surface-sunken disabled:opacity-35"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

type CardBook = { id: string; nameBn: string; allSahih?: boolean };

export function HadithCard({ hadith, book, section, language }: { hadith: HadithEntry; book: CardBook; section: number; language: "bn" | "en" }) {
  const { prefs } = usePrefs();
  const { isSaved, toggle } = useBookmarks();
  const [copied, setCopied] = useState(false);
  const [showGrades, setShowGrades] = useState(false);
  const saved = isSaved(book.id, hadith.number);
  const grade = summarizeGrade(hadith.grades, book.allSahih);
  const missingText = !hadith.text;
  const citation = `— ${book.nameBn}, হাদীস ${bn(hadith.number)}`;

  function shareText() {
    const body = hadith.narrator ? `${hadith.narrator} ${hadith.text}` : hadith.text || hadith.arabic;
    return `${body}\n\n${citation}`;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText());
      setCopied(true);
      toast.success("হাদীস কপি হয়েছে");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("কপি করা যায়নি");
    }
  }

  async function share() {
    const url = `${window.location.origin}/dashboard/hadith/${book.id}/${section}?h=${hadith.number}#h-${hadith.number}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${book.nameBn} — হাদীস ${bn(hadith.number)}`, text: shareText(), url });
        return;
      } catch {
        return; // cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText()}\n${url}`);
      toast.success("শেয়ার লিংকসহ কপি হয়েছে");
    } catch {
      toast.error("শেয়ার করা যায়নি");
    }
  }

  function bookmark() {
    const added = toggle({ book: book.id, section, number: hadith.number, preview: (hadith.text || hadith.arabic).slice(0, 180) });
    toast.success(added ? "বুকমার্কে সংরক্ষিত" : "বুকমার্ক থেকে সরানো হয়েছে");
  }

  return (
    <article id={`h-${hadith.number}`} data-hadith={hadith.number} className="surface scroll-mt-32 rounded-card p-4 target:ring-2 target:ring-primary/50 sm:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 items-center rounded-lg bg-primary px-2.5 text-sm font-bold tabular-nums text-on-primary">
          {bn(hadith.number)}
        </span>
        {hadith.reference ? <span className="text-xs text-muted-foreground">আরবি নং {bn(hadith.reference)}</span> : null}
        <button
          type="button"
          onClick={() => hadith.grades.length && setShowGrades((value) => !value)}
          className={cn("ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", gradeClass[grade.tone])}
          aria-expanded={hadith.grades.length ? showGrades : undefined}
        >
          {grade.label}
          {hadith.grades.length ? <ChevronDown className={cn("size-3.5 transition", showGrades && "rotate-180")} /> : null}
        </button>
      </header>

      {showGrades ? (
        <ul className="mt-3 space-y-1 rounded-xl bg-surface-sunken p-3 text-xs text-muted-foreground">
          {hadith.grades.map((item, index) => (
            <li key={index}>
              <span className="font-semibold text-foreground">{item.name || "মুহাদ্দিস"}:</span> {item.grade}
            </li>
          ))}
        </ul>
      ) : null}

      {prefs.showArabic && hadith.arabic ? (
        <p lang="ar" dir="rtl" className="arabic-text mt-4 rounded-xl bg-surface-sunken/70 px-4 py-3 text-right text-xl text-foreground sm:text-2xl">
          {hadith.arabic}
        </p>
      ) : null}

      <div lang={language === "en" ? "en" : "bn"} className={cn("mt-4 whitespace-pre-line text-foreground", language === "bn" && "font-bangla-serif", FONT_SIZES[prefs.fontSize] ?? FONT_SIZES[2])}>
        {hadith.narrator ? <p className="mb-1 font-semibold text-primary">{hadith.narrator}</p> : null}
        {missingText ? <p className="text-sm italic text-muted-foreground">এই হাদীসের অনুবাদ উৎসে পাওয়া যায়নি — আরবি মূল দেখুন।</p> : hadith.text}
      </div>

      <footer className="mt-4 flex items-center gap-1 border-t border-hairline pt-3">
        <button type="button" onClick={copy} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground">
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />} কপি
        </button>
        <button type="button" onClick={share} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground">
          <Share2 className="size-4" /> শেয়ার
        </button>
        <button
          type="button"
          onClick={bookmark}
          aria-pressed={saved}
          className={cn(
            "ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition",
            saved ? "bg-gold-soft text-gold-foreground" : "text-muted-foreground hover:bg-surface-sunken hover:text-foreground",
          )}
        >
          {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />} {saved ? "সংরক্ষিত" : "বুকমার্ক"}
        </button>
      </footer>
    </article>
  );
}

/**
 * Remembers the hadith nearest the top of the screen as "last read" and,
 * when the URL targets a hadith (#h-123), scrolls it into view after load.
 */
export function ReadingTracker({ book, section, page }: { book: string; section: number; page: number }) {
  const lastSaved = useRef(0);

  useEffect(() => {
    saveLastRead({ book, section });
    const hash = window.location.hash;
    if (hash.startsWith("#h-")) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });

    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-hadith]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const number = Number((visible.target as HTMLElement).dataset.hadith);
        const now = Date.now();
        if (number && now - lastSaved.current > 800) {
          lastSaved.current = now;
          saveLastRead({ book, section, number });
        }
      },
      { rootMargin: "-120px 0px -55% 0px" },
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [book, section, page]);

  return null;
}
