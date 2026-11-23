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

type Tone = { card: string; medal: string; text: string; chip: string; ring: string };
const CATEGORY_TONES: Record<AsmaulHusna["category"], Tone> = {
  "রহমত ও ক্ষমা": {
    card: "from-cat-salah/20 via-surface to-surface hover:border-cat-salah/60",
    medal: "bg-cat-salah text-white",
    text: "text-cat-salah",
    chip: "bg-cat-salah/12 text-cat-salah",
    ring: "from-cat-salah/40",
  },
  "সার্বভৌমত্ব ও ক্ষমতা": {
    card: "from-warning/25 via-surface to-surface hover:border-warning/60",
    medal: "bg-warning text-white",
    text: "text-warning",
    chip: "bg-warning/14 text-warning",
    ring: "from-warning/45",
  },
  "জ্ঞান ও প্রজ্ঞা": {
    card: "from-info/22 via-surface to-surface hover:border-info/60",
    medal: "bg-info text-white",
    text: "text-info",
    chip: "bg-info/14 text-info",
    ring: "from-info/45",
  },
  "সৃষ্টি ও রিযিক": {
    card: "from-success/22 via-surface to-surface hover:border-success/60",
    medal: "bg-success text-white",
    text: "text-success",
    chip: "bg-success/14 text-success",
    ring: "from-success/45",
  },
  "পবিত্রতা ও মহিমা": {
    card: "from-cat-dhikr/22 via-surface to-surface hover:border-cat-dhikr/60",
    medal: "bg-cat-dhikr text-white",
    text: "text-cat-dhikr",
    chip: "bg-cat-dhikr/14 text-cat-dhikr",
    ring: "from-cat-dhikr/45",
  },
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
    const text = `${item.arabic}\nউচ্চারণ: ${item.bangla} (${details.transliteration})\nঅর্থ: ${item.meaning}\n\nব্যাখ্যা: ${item.explanation}\n\nভাবনা: ${details.reflection}${details.evidence ? `\nসূত্র: ${details.evidence.label}` : ""}`;
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
            <p dir="rtl" lang="ar" className="quran-text mt-1 text-lg leading-loose text-foreground">وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَىٰ فَادْعُوهُ بِهَا</p>
            <p className="text-sm leading-relaxed text-muted-foreground">আল্লাহর জন্যই রয়েছে সুন্দরতম নামসমূহ; তোমরা সেই নামেই তাঁকে ডাকো। — সূরা আল-আ‘রাফ ৭:১৮০</p>
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
                    ? "bg-active text-on-active shadow-sm"
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
          {filtered.map((item) => {
            const tone = CATEGORY_TONES[item.category];
            const info = getNameDetails(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveName(item)}
                className={cn(
                  "group relative flex w-full flex-col overflow-hidden rounded-3xl border border-hairline bg-linear-to-br p-4 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                  tone.card,
                )}
              >
                <span aria-hidden="true" className={cn("pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-radial from-40% to-transparent to-70% opacity-70", tone.ring)} />
                <span aria-hidden="true" className="pointer-events-none absolute -bottom-8 -left-8 size-24 rotate-45 rounded-3xl border border-current opacity-[0.06]" />
                <span className="relative flex items-start justify-between gap-3">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold tabular-nums shadow-sm", tone.medal)}>{bnNum(item.id)}</span>
                  <span dir="rtl" lang="ar" className={cn("quran-text break-words text-right text-[2rem] font-medium leading-[1.5] sm:text-4xl", tone.text)}>{item.arabic}</span>
                </span>
                <span className="relative mt-3 block text-lg font-bold text-foreground">{item.bangla}</span>
                <span lang="en" className="relative block text-xs tracking-wide text-muted-foreground">{info.transliteration}</span>
                <span className="relative mt-2 block text-sm leading-relaxed text-foreground/80 line-clamp-2">{item.meaning}</span>
                <span className="relative mt-3 flex items-center justify-between gap-2">
                  <span className={cn("rounded-lg px-2.5 py-1 text-[11px] font-semibold", tone.chip)}>{item.category}</span>
                  <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", tone.text)}>
                    বিস্তারিত <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </button>
            );
          })}
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
            <div className={cn("rounded-2xl border border-hairline bg-linear-to-br p-5 text-center", CATEGORY_TONES[activeName.category].card)}>
              <span className={cn("inline-block rounded-lg px-3 py-1 text-xs font-bold", CATEGORY_TONES[activeName.category].chip)}>
                পবিত্র নাম নং {bnNum(activeName.id)}
              </span>
              <p dir="rtl" lang="ar" className={cn("quran-text my-3 text-5xl font-medium leading-[1.6]", CATEGORY_TONES[activeName.category].text)}>
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
                <p className="flex flex-wrap items-center gap-2"><span className="font-semibold text-foreground">{getNameDetails(activeName.id).evidence?.kind === "name" ? "নামের উল্লেখ" : "সংশ্লিষ্ট গুণের উল্লেখ"}:</span><span className="rounded-lg bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">{getNameDetails(activeName.id).evidence?.label}</span></p>
              ) : <p>প্রচলিত তালিকার নাম; এখানে পৃথক নাম হিসেবে সরাসরি দলিল সংযুক্ত করা হয়নি।</p>}
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
