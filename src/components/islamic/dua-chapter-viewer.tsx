"use client";

import { Copy, Eye, EyeOff, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CatalogDua, DuaChapter } from "@/lib/dua-catalog";
import { formatCatalogDua } from "@/lib/dua-format";
import { bnNum } from "@/lib/quran";
import { cn } from "@/lib/utils";

// Keep the complete catalog in server code: this component receives one chapter only.
export function DuaChapterViewer({ chapter, embedded = false }: { chapter: DuaChapter; embedded?: boolean }) {
  const [showPronunciation, setShowPronunciation] = useState(false);
  async function copy(dua?: CatalogDua) {
    try {
      await navigator.clipboard.writeText(dua ? formatCatalogDua(dua, chapter.title) : chapter.duas.map((entry) => formatCatalogDua(entry, chapter.title)).join("\n\n────────────\n\n"));
      toast.success("কপি করা হয়েছে");
    } catch { toast.error("কপি করা যায়নি। আবার চেষ্টা করুন।"); }
  }
  const chip = "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition";
  return <div className="space-y-4">
    <style>{`@media print { header, nav, aside, .dua-no-print { display:none!important } .catalog-dua-content { display:block!important } .catalog-dua { break-inside:avoid; box-shadow:none!important } .catalog-dua * { color:#000!important } }`}</style>
    <div className="dua-no-print flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={showPronunciation} onClick={() => setShowPronunciation(!showPronunciation)} className={cn(chip, showPronunciation ? "bg-active text-on-active shadow-sm" : "bg-surface-sunken text-muted-foreground hover:text-foreground")}>
        {showPronunciation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}উচ্চারণ {showPronunciation ? "লুকান" : "দেখুন"}
      </button>
      <button type="button" onClick={() => copy()} className={cn(chip, "border border-hairline bg-surface text-foreground hover:bg-surface-sunken")}><Copy className="size-4" />সব কপি</button>
      {embedded ? null : <button type="button" onClick={() => window.print()} className={cn(chip, "border border-hairline bg-surface text-foreground hover:bg-surface-sunken")}><Printer className="size-4" />প্রিন্ট / PDF</button>}
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">বাংলা উচ্চারণ আরবি শেখার সহায়ক মাত্র। সব বর্ণনা একই মানের নয়—দুর্বলতার মন্তব্য থাকলে সেটিও পড়ুন।</p>
    {chapter.duas.map((dua, index) => <article key={dua.id} className="catalog-dua overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
      <header className="flex items-center gap-3 border-b border-hairline bg-linear-to-r from-primary-soft/70 to-transparent px-4 py-3">
        {chapter.duas.length > 1 ? <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-active text-xs font-bold text-on-active">{bnNum(index + 1)}</span> : null}
        <h2 className="min-w-0 flex-1 text-sm font-bold sm:text-base">{dua.title}</h2>
        <button type="button" onClick={() => copy(dua)} aria-label={`${dua.title} কপি করুন`} className="dua-no-print grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-primary-soft hover:text-primary"><Copy className="size-4" /></button>
      </header>
      <div className="catalog-dua-content space-y-5 px-4 py-4 sm:px-5">
        {dua.segments.map((segment, segmentIndex) => <div key={segmentIndex} className="space-y-3 border-b border-hairline pb-4 last:border-0 last:pb-0">
          {segment.introduction ? <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{segment.introduction}</p> : null}
          {segment.arabic ? <p dir="rtl" lang="ar" className="quran-text rounded-xl bg-primary-soft/40 px-3 py-3 text-right text-2xl leading-[2.1] text-primary sm:text-3xl">{segment.arabic}</p> : null}
          {showPronunciation && segment.pronunciation ? <div className="dua-no-print rounded-xl bg-surface-sunken p-3"><h3 className="mb-1 text-xs font-semibold text-muted-foreground">সহায়ক উচ্চারণ</h3><p className="text-sm leading-relaxed">{segment.pronunciation}</p></div> : null}
          {segment.meaning ? <p className="whitespace-pre-line font-bangla-serif text-base leading-[1.9]">{segment.meaning}</p> : segment.arabic ? <p className="text-xs text-muted-foreground">এই অংশের বাংলা অর্থ দেওয়া নেই।</p> : null}
          {segment.note ? <p className="whitespace-pre-line rounded-xl border border-hairline bg-surface-sunken/60 p-3 text-sm leading-relaxed text-muted-foreground">{segment.note}</p> : null}
          {segment.reference ? <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground"><span className="font-semibold text-primary">সূত্র: </span>{segment.reference}</p> : null}
        </div>)}
        {!dua.segments.some((segment) => segment.reference) ? <p className="text-xs text-muted-foreground">এই এন্ট্রির জন্য পৃথক দলিল দেওয়া নেই।</p> : null}
      </div>
    </article>)}
  </div>;
}
