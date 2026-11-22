"use client";

import {
  Check,
  Copy,
  ChevronDown,
  Printer,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SALAT_DUAS, type SalatDua } from "@/lib/salat-duas";
import { bnNum } from "@/lib/quran";
import { cn } from "@/lib/utils";

const STAGES = [
  "সব",
  "শুরু",
  "কিয়াম ও কিরাআত",
  "রুকু",
  "কওমা",
  "সিজদা",
  "জলসা",
  "তাশাহহুদ",
  "সমাপ্তি",
  "সালামের পর",
] as const;

export function SalatDuasViewer() {
  const [selectedStage, setSelectedStage] = useState<string>("সব");
  const [search, setSearch] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  function toggleStep(step: number) {
    setExpandedSteps((previous) => {
      const next = new Set(previous);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SALAT_DUAS.filter((dua) => {
      const matchStage = selectedStage === "সব" || dua.stage === selectedStage;
      if (!matchStage) return false;
      if (!q) return true;
      return (
        dua.title.toLowerCase().includes(q) ||
        dua.meaning.toLowerCase().includes(q) ||
        dua.arabic.includes(q) ||
        dua.location.toLowerCase().includes(q)
      );
    });
  }, [selectedStage, search]);

  async function copySingle(dua: SalatDua) {
    const text = `${dua.title} (${dua.location})\n\n${dua.arabic}\n\nঅর্থ: ${dua.meaning}\n(সূত্র: ${dua.reference})`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${dua.title} কপি করা হয়েছে`);
    } catch {
      toast.error("কপি করা যায়নি। আবার চেষ্টা করুন।");
    }
  }

  function handlePrint() {
    window.print();
  }

  async function copyFullGuide() {
    const header = "নামাজের প্রয়োজনীয় আরবি ও অর্থ (তাকবীর থেকে সালাম)\nউৎস: মুহাসাবাহ\n========================================\n\n";
    const body = SALAT_DUAS.map(
      (d) =>
        `[ধাপ ${d.step}] ${d.title} (${d.location})\n${d.arabic}\nঅর্থ: ${d.meaning}\nসূত্র: ${d.reference}\n`
    ).join("\n----------------------------------------\n\n");

    try {
      await navigator.clipboard.writeText(header + body);
      setCopiedAll(true);
      toast.success("নামাজের সকল দু'আ ও অর্থ কপি করা হয়েছে");
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      toast.error("কপি করা যায়নি। আবার চেষ্টা করুন।");
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Print Stylesheet ── */}
      <style>{`
        @media print {
          header, aside, nav, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
          }
          .dua-content {
            display: block !important;
          }
          .dua-card {
            page-break-inside: avoid;
            border: 1px solid #ddd !important;
            margin-bottom: 1rem !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
          }
        }
      `}</style>

      {/* ── Banner & Download Actions (no-print) ── */}
      <div className="no-print rounded-card border border-hairline bg-surface p-4 sm:p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                শুরু থেকে শেষ পর্যন্ত
              </span>
              <span className="text-xs text-muted-foreground">তাকবীর থেকে সালাম</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-foreground">
              নামাজ
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              বিশুদ্ধ আরবি পাঠ ও তার বাংলা অনুবাদ—উচ্চারণহীন প্রামাণ্য সংকলন।
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyFullGuide}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hairline bg-surface px-3.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-surface-sunken active:scale-95"
            >
              {copiedAll ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              <span>কপি করুন</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-on-primary shadow-sm transition hover:opacity-90 active:scale-95"
            >
              <Printer className="size-4" />
              <span>পিডিএফ / প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Search & Stages Filter */}
        <div className="mt-4 space-y-2.5 border-t border-hairline pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="দু'আ খুঁজুন... (যেমন: সানা, রুকু, সিজদা, তাশাহহুদ)"
              aria-label="নামাজের দু'আ খুঁজুন"
              className="h-10 w-full rounded-xl border border-hairline bg-surface-sunken pl-9 pr-4 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {STAGES.map((stg) => {
              const active = selectedStage === stg;
              return (
                <button
                  key={stg}
                  type="button"
                  onClick={() => setSelectedStage(stg)}
                  className={cn(
                    "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-sunken text-muted-foreground hover:bg-surface hover:text-foreground",
                  )}
                >
                  {stg}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Print Header (visible only when printing) ── */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">নামাজের গুরুত্বপূর্ণ আরবি ও বাংলা অর্থ</h1>
        <p className="text-sm text-gray-600">তাকবীরে তাহরীমা থেকে সালাম পর্যন্ত — মুহাসাবাহ সংকলন</p>
      </div>

      {/* ── Duas List ── */}
      <div className="space-y-4 print-container">
        {filtered.map((item) => (
          <article
            key={item.step}
            className="dua-card rounded-2xl border border-hairline bg-surface p-3 sm:p-4 shadow-card transition-all hover:border-primary/40"
          >
            {/* Header: Step & Location */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="min-w-0 flex-1">
                <button
                  type="button"
                  id={`dua-trigger-${item.step}`}
                  aria-expanded={expandedSteps.has(item.step)}
                  aria-controls={`dua-content-${item.step}`}
                  onClick={() => toggleStep(item.step)}
                  className="flex w-full items-center gap-2 rounded-lg py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                    {bnNum(item.step)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm sm:text-base font-bold text-foreground">
                      {item.title}
                    </span>
                    <span className="block text-[11px] font-medium text-muted-foreground">
                      {item.location}
                    </span>
                  </span>
                  <ChevronDown aria-hidden="true" className={cn("no-print size-4 shrink-0 transition-transform motion-reduce:transition-none", expandedSteps.has(item.step) && "rotate-180")} />
                </button>
              </h3>

              <div className="no-print flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copySingle(item)}
                  title="কপি করুন"
                  aria-label={`${item.title} কপি করুন`}
                  className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-surface-sunken hover:text-foreground transition"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>

            <div
              id={`dua-content-${item.step}`}
              aria-labelledby={`dua-trigger-${item.step}`}
              className={cn("dua-content min-h-[8rem]", !expandedSteps.has(item.step) && "hidden")}
            >
              {/* Arabic Text */}
              <div className="my-3.5 rounded-xl bg-surface-sunken/60 p-3.5 sm:p-4">
                <p
                  dir="rtl"
                  lang="ar"
                  className="quran-text text-right text-2xl sm:text-[1.75rem] leading-[2.1] text-foreground font-medium"
                >
                  {item.arabic}
                </p>
              </div>
  
              {/* Bangla Meaning (strictly no transliteration) */}
              <div className="space-y-1.5">
                <p className="font-bangla-serif text-sm sm:text-base leading-[1.9] text-foreground/90">
                  {item.meaning}
                </p>
              </div>
  
              {/* Reference & Note */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-hairline pt-2 text-xs text-muted-foreground">
                <span className="font-medium text-[11px]">
                  দলিল: {item.reference}
                </span>
                {item.note ? (
                  <span className="text-[11px] italic text-muted-foreground/80">
                    {item.note}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 ? (
          <p role="status" className="rounded-2xl border border-hairline bg-surface p-6 text-center text-sm text-muted-foreground">
            কোনো দু&apos;আ পাওয়া যায়নি। ভিন্ন শব্দ বা ধাপ নির্বাচন করুন।
          </p>
        ) : null}
      </div>
    </div>
  );
}
