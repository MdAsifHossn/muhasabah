"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Copy,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import { toast } from "sonner";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { ASMAUL_HUSNA, type AsmaulHusna } from "@/lib/asmaul-husna";
import { getNameDetails } from "@/lib/asmaul-husna-details";
import { normalizeIslamicSearch } from "@/lib/islamic-search";
import { bnNum } from "@/lib/quran";


const CATEGORIES = [
  "সব",
  "রহমত ও ক্ষমা",
  "সার্বভৌমত্ব ও ক্ষমতা",
  "জ্ঞান ও প্রজ্ঞা",
  "সৃষ্টি ও রিযিক",
  "পবিত্রতা ও মহিমা",
] as const;

const CATEGORY_ACCENTS: Record<AsmaulHusna["category"], string> = {
  "রহমত ও ক্ষমা": "border-l-primary/60",
  "সার্বভৌমত্ব ও ক্ষমতা": "border-l-gold/60",
  "জ্ঞান ও প্রজ্ঞা": "border-l-info/60",
  "সৃষ্টি ও রিযিক": "border-l-success/60",
  "পবিত্রতা ও মহিমা": "border-l-cat-dhikr/60",
};

export function NamesOfAllahViewer() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("সব");
  const [activeName, setActiveName] = useState<AsmaulHusna | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeIslamicSearch(query);
    return ASMAUL_HUSNA.filter((item) => {
      const matchCat =
        selectedCategory === "সব" || item.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return normalizeIslamicSearch([item.arabic, item.bangla, item.meaning, item.explanation, getNameDetails(item.id).transliteration, item.id].join(" ")).includes(q);
    });
  }, [query, selectedCategory]);

  async function copyName(item: AsmaulHusna) {
    const details = getNameDetails(item.id);
    const text = `${item.arabic}\nউচ্চারণ: ${item.bangla} (${details.transliteration})\nঅর্থ: ${item.meaning}\n\nব্যাখ্যা: ${item.explanation}\n\nভাবনা: ${details.reflection}${details.evidence ? `\nসূত্র: ${details.evidence.label} (${details.evidence.url})` : ""}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("নাম ও অর্থ কপি করা হয়েছে");
    } catch {
      toast.error("কপি করা যায়নি। আবার চেষ্টা করুন।");
    }
  }

  function nextName() {
    if (!activeName) return;
    const nextIdx = activeName.id % ASMAUL_HUSNA.length;
    setActiveName(ASMAUL_HUSNA[nextIdx]);
  }

  function prevName() {
    if (!activeName) return;
    const prevIdx = activeName.id === 1 ? ASMAUL_HUSNA.length - 1 : activeName.id - 2;
    setActiveName(ASMAUL_HUSNA[prevIdx]);
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-linear-to-br from-primary-soft via-surface to-gold-soft px-4 py-4 sm:px-6">
        <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-10 size-40 rounded-full border-[20px] border-primary/5" />
        <div className="relative flex items-center gap-4">
          <span dir="rtl" lang="ar" className="quran-text text-5xl leading-normal text-primary sm:text-6xl">الله</span>
          <div className="min-w-0 border-l border-primary/15 pl-4">
            <p className="text-sm font-semibold text-primary">সুন্দরতম নামগুলো আল্লাহরই</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">তাঁকে এসব নামেই ডাকুন। <a href="https://quran.com/7/180" target="_blank" rel="noreferrer" className="underline underline-offset-4">সূরা আল-আ‘রাফ ৭:১৮০</a></p>
          </div>
        </div>
      </div>
      {/* ── Top Bar: Search and Categories ── */}
      <div className="space-y-3 rounded-card border border-hairline bg-surface p-3 sm:p-4 shadow-card">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম বা অর্থ দিয়ে খুঁজুন... (যেমন: রহমান, ক্ষমা, رزاق)"
            aria-label="নাম বা অর্থ দিয়ে খুঁজুন"
            className="h-11 w-full rounded-xl border border-hairline bg-surface-sunken pl-9 pr-4 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="অনুসন্ধান মুছুন"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-sunken text-muted-foreground hover:bg-surface-sunken/80 hover:text-foreground",
                )}
              >
                {cat} {cat === "সব" ? `(${bnNum(99)})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid of 99 Names ── */}
      {filtered.length === 0 ? (
        <div className="rounded-card border border-hairline bg-surface p-8 text-center shadow-card">
          <Sparkles className="mx-auto size-8 text-muted-foreground opacity-40" />
          <p className="mt-2 text-sm font-semibold">কোনো নাম পাওয়া যায়নি</p>
          <p className="mt-1 text-xs text-muted-foreground">ভিন্ন শব্দ লিখে আবার চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveName(item)}
              className={cn(
                "group relative grid w-full grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] items-center gap-3 overflow-hidden rounded-2xl border border-l-[3px] border-hairline bg-linear-to-br from-surface via-surface to-primary-soft/40 px-3 py-3 text-left shadow-card transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4 sm:py-4",
                CATEGORY_ACCENTS[item.category],
              )}
            >
              <span className="min-w-0">
                <span className="mb-1 block text-xs font-semibold tabular-nums text-gold">{bnNum(item.id).padStart(2, "০")} · আসমাউল হুসনা</span>
                <span className="block text-sm font-bold text-foreground sm:text-base">
                  {item.bangla}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {item.meaning}
                </span>
              </span>
              <span className="min-w-0 border-l border-primary/10 pl-3 text-center">
                <span dir="rtl" lang="ar" className="quran-text block break-words text-[1.7rem] leading-[1.65] font-medium text-primary sm:text-3xl">{item.arabic}</span>
                <span className="mt-1 block text-xs text-muted-foreground">বিস্তারিত</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">এটি বহুল প্রচলিত ৯৯ নামের সংকলন। আল্লাহর নাম এই সংখ্যায় সীমাবদ্ধ নয়; নির্দিষ্ট তালিকা নির্ধারণে আলেমদের আলোচনা রয়েছে। উচ্চারণের বাংলা ও ইংরেজি লেখা সহায়ক মাত্র—শুদ্ধ আরবি শেখার বিকল্প নয়।</p>

      {/* ── Detail Modal / Sheet ── */}
      <ResponsiveSheet
        open={activeName !== null}
        onClose={() => setActiveName(null)}
        title={activeName ? `${activeName.bangla} • ${bnNum(activeName.id)}তম নাম` : "আল্লাহর নাম"}
        className="sm:max-w-lg"
      >
        {activeName ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-hairline bg-surface-sunken p-5 text-center">
              <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                পবিত্র নাম নং {bnNum(activeName.id)}
              </span>
              <p dir="rtl" lang="ar" className="quran-text my-3 text-4xl text-primary font-medium">
                {activeName.arabic}
              </p>
              <h2 className="text-xl font-bold text-foreground">
                {activeName.bangla}
              </h2>
              <p lang="en" className="mt-1 text-sm tracking-wide text-primary">{getNameDetails(activeName.id).transliteration}</p>
              <p className="mt-1 text-xs text-muted-foreground">উচ্চারণ: {activeName.bangla}</p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {activeName.meaning}
              </p>
            </div>

            <div className="rounded-xl border border-primary/15 bg-primary-soft/50 p-4">
              <h3 className="text-sm font-bold text-primary">জীবনে অনুধাবন</h3>
              <p className="mt-2 text-sm leading-relaxed">{getNameDetails(activeName.id).reflection}</p>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {getNameDetails(activeName.id).evidence ? (
                <p><span className="font-semibold text-foreground">{getNameDetails(activeName.id).evidence?.kind === "name" ? "নামের উল্লেখ" : "সংশ্লিষ্ট গুণের উল্লেখ"}: </span><a className="text-primary underline underline-offset-4" href={getNameDetails(activeName.id).evidence?.url} target="_blank" rel="noreferrer">{getNameDetails(activeName.id).evidence?.label}</a></p>
              ) : <p>প্রচলিত তালিকার নাম; এখানে পৃথক নাম হিসেবে সরাসরি দলিল সংযুক্ত করা হয়নি।</p>}
              <a href="https://www.hadithbd.com/99namesofallah/" target="_blank" rel="noreferrer" className="inline-block text-primary underline underline-offset-4">হাদিসবিডিতে আরও পড়ুন</a>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <BookOpen className="size-3.5 text-primary" /> নামের অর্থ ও বিশদ তাৎপর্য
              </h4>
              <p className="font-bangla-serif text-sm leading-relaxed text-foreground/90 bg-card rounded-xl p-4 border border-hairline">
                {activeName.explanation}
              </p>
            </div>

            {/* Bottom Actions: Prev / Next / Copy */}
            <div className="flex items-center justify-between border-t border-hairline pt-3">
              <button
                type="button"
                onClick={prevName}
                className="inline-flex items-center gap-1 rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-sunken hover:text-foreground transition"
              >
                <ChevronLeft className="size-4" /> আগের নাম
              </button>
              <button
                type="button"
                onClick={() => copyName(activeName)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary-soft/80 transition"
              >
                <Copy className="size-3.5" /> কপি করুন
              </button>
              <button
                type="button"
                onClick={nextName}
                className="inline-flex items-center gap-1 rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface-sunken hover:text-foreground transition"
              >
                পরের নাম <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </ResponsiveSheet>
    </div>
  );
}
