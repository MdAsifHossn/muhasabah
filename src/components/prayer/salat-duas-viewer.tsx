"use client";

import { Check, ChevronLeft, ChevronRight, Copy, Printer, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { SALAT_DUAS, SALAT_STAGES, type SalatDua, type SalatStage } from "@/lib/salat-duas";
import { normalizeIslamicSearch } from "@/lib/islamic-search";
import { bnNum } from "@/lib/quran";
import { cn } from "@/lib/utils";

type Tone = { card: string; medal: string; text: string; chip: string };

const STAGE_TONES: Record<SalatStage, Tone> = {
  "শুরু": { card: "from-cat-salah/18", medal: "bg-cat-salah text-white", text: "text-cat-salah", chip: "bg-cat-salah/12 text-cat-salah" },
  "কিয়াম ও কিরাআত": { card: "from-cat-quran/18", medal: "bg-cat-quran text-white", text: "text-cat-quran", chip: "bg-cat-quran/12 text-cat-quran" },
  "রুকু": { card: "from-info/18", medal: "bg-info text-white", text: "text-info", chip: "bg-info/14 text-info" },
  "কওমা": { card: "from-cat-discipline/18", medal: "bg-cat-discipline text-white", text: "text-cat-discipline", chip: "bg-cat-discipline/12 text-cat-discipline" },
  "সিজদা": { card: "from-cat-dhikr/18", medal: "bg-cat-dhikr text-white", text: "text-cat-dhikr", chip: "bg-cat-dhikr/12 text-cat-dhikr" },
  "জলসা": { card: "from-cat-character/16", medal: "bg-cat-character text-white", text: "text-cat-character", chip: "bg-cat-character/12 text-cat-character" },
  "তাশাহহুদ": { card: "from-warning/20", medal: "bg-warning text-white", text: "text-warning", chip: "bg-warning/14 text-warning" },
  "সমাপ্তি": { card: "from-success/18", medal: "bg-success text-white", text: "text-success", chip: "bg-success/14 text-success" },
  "সালামের পর": { card: "from-cat-service/18", medal: "bg-cat-service text-white", text: "text-cat-service", chip: "bg-cat-service/14 text-cat-service" },
  "বিতর ও বিশেষ": { card: "from-cat-reading/18", medal: "bg-cat-reading text-white", text: "text-cat-reading", chip: "bg-cat-reading/14 text-cat-reading" },
};

function plainText(dua: SalatDua) {
  return `${dua.title} (${dua.location})\n\n${dua.arabic}\n\nঅর্থ: ${dua.meaning}\n(সূত্র: ${dua.reference})`;
}

export function SalatDuasViewer() {
  const [selectedStage, setSelectedStage] = useState<string>("সব");
  const [search, setSearch] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = normalizeIslamicSearch(search);
    return SALAT_DUAS.filter((dua) => {
      if (selectedStage !== "সব" && dua.stage !== selectedStage) return false;
      if (!q) return true;
      return normalizeIslamicSearch(`${dua.title} ${dua.meaning} ${dua.arabic} ${dua.location} ${dua.stage} ${dua.reference}`).includes(q);
    });
  }, [selectedStage, search]);

  const groups = useMemo(() => {
    const map = new Map<SalatStage, SalatDua[]>();
    for (const dua of filtered) map.set(dua.stage, [...(map.get(dua.stage) ?? []), dua]);
    return Array.from(map.entries());
  }, [filtered]);

  const activeIndex = activeStep === null ? -1 : filtered.findIndex((dua) => dua.step === activeStep);
  const active = activeIndex >= 0 ? filtered[activeIndex] : null;

  async function copyText(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(success);
      return true;
    } catch {
      toast.error("কপি করা যায়নি। আবার চেষ্টা করুন।");
      return false;
    }
  }

  async function copyFullGuide() {
    const header = "নামাজের প্রয়োজনীয় আরবি ও অর্থ (তাকবীর থেকে সালাম)\nউৎস: মুহাসাবাহ\n========================================\n\n";
    const body = SALAT_DUAS.map((d) => `[ধাপ ${d.step}] ${d.title} (${d.location})\n${d.arabic}\nঅর্থ: ${d.meaning}\nসূত্র: ${d.reference}\n`).join("\n----------------------------------------\n\n");
    if (await copyText(header + body, "নামাজের সকল দু'আ ও অর্থ কপি করা হয়েছে")) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  }

  function go(offset: number) {
    const next = filtered[activeIndex + offset];
    if (next) setActiveStep(next.step);
  }

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          header, aside, nav, .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
          .print-only { display: block !important; }
          .dua-card { page-break-inside: avoid; border: 1px solid #ddd !important; margin-bottom: 1rem !important; padding: 0.75rem; box-shadow: none !important; background: #fff !important; color: #000 !important; }
        }
      `}</style>

      {/* ── Banner, search and stage filter ── */}
      <div className="no-print space-y-4 rounded-card border border-hairline bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">শুরু থেকে শেষ পর্যন্ত</span>
              <span className="text-xs text-muted-foreground">{bnNum(SALAT_DUAS.length)}টি দু&apos;আ, সূরা ও যিকির</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-foreground">নামাজ</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">বিশুদ্ধ আরবি পাঠ ও তার বাংলা অনুবাদ—উচ্চারণহীন প্রামাণ্য সংকলন। কার্ডে চাপ দিলে পূর্ণ পাঠ ও সূত্র খুলবে।</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyFullGuide} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-hairline bg-surface px-3.5 text-xs font-semibold text-foreground shadow-sm transition hover:bg-surface-sunken active:scale-95">
              {copiedAll ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              <span>সব কপি</span>
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-active px-4 text-xs font-bold text-on-active shadow-sm transition hover:opacity-90 active:scale-95">
              <Printer className="size-4" />
              <span>পিডিএফ / প্রিন্ট</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="খুঁজুন… (যেমন: সানা, রুকু, সিজদা, কুনূত, ইখলাস)"
            aria-label="নামাজের দু'আ খুঁজুন"
            className="h-11 w-full rounded-xl border border-hairline bg-surface-sunken pl-9 pr-9 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")} aria-label="অনুসন্ধান মুছুন" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <div role="group" aria-label="নামাজের ধাপ" className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {["সব", ...SALAT_STAGES].map((stage) => {
            const on = selectedStage === stage;
            return (
              <button
                key={stage}
                type="button"
                aria-pressed={on}
                onClick={() => setSelectedStage(stage)}
                className={cn("shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition", on ? "bg-active text-on-active shadow-sm" : "bg-surface-sunken text-muted-foreground hover:text-foreground")}
              >
                {stage}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Print only: the whole guide ── */}
      <div className="print-only hidden">
        <h1 className="mb-1 text-2xl font-bold">নামাজের গুরুত্বপূর্ণ আরবি ও বাংলা অর্থ</h1>
        <p className="mb-4 text-sm">তাকবীরে তাহরীমা থেকে সালাম পর্যন্ত — মুহাসাবাহ সংকলন</p>
        {filtered.map((item) => (
          <article key={item.step} className="dua-card">
            <h3 className="font-bold">{bnNum(item.step)}. {item.title} <span className="text-xs font-normal">({item.location})</span></h3>
            <p dir="rtl" lang="ar" className="quran-text my-2 text-right text-2xl leading-loose">{item.arabic}</p>
            <p className="text-sm">{item.meaning}</p>
            <p className="mt-1 text-xs">দলিল: {item.reference}</p>
            {item.note ? <p className="text-xs italic">{item.note}</p> : null}
          </article>
        ))}
      </div>

      {/* ── Cards grouped by stage ── */}
      <div className="no-print space-y-7">
        {groups.map(([stage, items]) => {
          const tone = STAGE_TONES[stage];
          return (
            <section key={stage} aria-labelledby={`stage-${stage}`} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={cn("rounded-lg px-3 py-1 text-xs font-bold", tone.chip)} id={`stage-${stage}`}>{stage}</span>
                <span className="h-px flex-1 bg-hairline" />
                <span className="text-xs text-muted-foreground">{bnNum(items.length)}টি</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {items.map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(item.step)}
                    className={cn(
                      "group relative flex w-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-hairline bg-linear-to-br via-surface to-surface p-4 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                      tone.card,
                    )}
                  >
                    <span className="flex items-start gap-3">
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold tabular-nums shadow-sm", tone.medal)}>{bnNum(item.step)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground sm:text-base">{item.title}</span>
                        <span className="block text-[11px] font-medium text-muted-foreground">{item.location}</span>
                      </span>
                    </span>
                    <span dir="rtl" lang="ar" className={cn("quran-text line-clamp-2 text-right text-xl leading-[2] sm:text-2xl", tone.text)}>{item.arabic}</span>
                    <span className="line-clamp-2 font-bangla-serif text-sm leading-relaxed text-foreground/80">{item.meaning}</span>
                    <span className="flex items-center justify-between gap-2 border-t border-hairline pt-2 text-[11px]">
                      <span className="min-w-0 truncate text-muted-foreground">{item.reference}</span>
                      <span className={cn("inline-flex shrink-0 items-center gap-0.5 font-semibold", tone.text)}>
                        পড়ুন <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        {filtered.length === 0 ? (
          <p role="status" className="rounded-2xl border border-hairline bg-surface p-6 text-center text-sm text-muted-foreground">
            কোনো দু&apos;আ পাওয়া যায়নি। ভিন্ন শব্দ বা ধাপ নির্বাচন করুন।
          </p>
        ) : null}
      </div>

      {/* ── Detail popup ── */}
      <ResponsiveSheet open={active !== null} onClose={() => setActiveStep(null)} title={active ? `${bnNum(active.step)}. ${active.title}` : "নামাজের দু'আ"} description={active ? `${active.stage} · ${active.location}` : undefined} className="sm:max-w-2xl">
        {active ? (
          <div className="space-y-4">
            <div className={cn("rounded-2xl border border-hairline bg-linear-to-br via-surface to-surface p-4 sm:p-5", STAGE_TONES[active.stage].card)}>
              <p dir="rtl" lang="ar" className={cn("quran-text text-right text-3xl font-medium leading-[2.1] sm:text-[2rem]", STAGE_TONES[active.stage].text)}>{active.arabic}</p>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold tracking-wide text-muted-foreground">বাংলা অর্থ</h3>
              <p className="font-bangla-serif text-base leading-[1.95] text-foreground">{active.meaning}</p>
            </div>
            {active.note ? <p className="rounded-xl border border-hairline bg-surface-sunken/70 p-3 text-sm leading-relaxed text-muted-foreground">{active.note}</p> : null}
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">দলিল:</span>
              <span className="rounded-lg bg-primary-soft px-2.5 py-1 font-semibold text-primary">{active.reference}</span>
            </p>
            <div className="flex items-center justify-between gap-2 border-t border-hairline pt-3">
              <button type="button" onClick={() => go(-1)} disabled={activeIndex <= 0} className="inline-flex items-center gap-1 rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground disabled:opacity-40">
                <ChevronLeft className="size-4" /> আগেরটি
              </button>
              <button type="button" onClick={() => copyText(plainText(active), `${active.title} কপি করা হয়েছে`)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft px-3.5 py-2 text-xs font-bold text-primary transition hover:opacity-90">
                <Copy className="size-3.5" /> কপি করুন
              </button>
              <button type="button" onClick={() => go(1)} disabled={activeIndex >= filtered.length - 1} className="inline-flex items-center gap-1 rounded-xl border border-hairline px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground disabled:opacity-40">
                পরেরটি <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
      </ResponsiveSheet>
    </div>
  );
}
