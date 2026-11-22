"use client";

import { Copy, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { CatalogDua, DuaChapter } from "@/lib/dua-catalog";
import { formatCatalogDua } from "@/lib/dua-format";
import { bnNum } from "@/lib/quran";

// Keep the complete catalog in server code: this component receives one chapter only.
export function DuaChapterViewer({ chapter }: { chapter: DuaChapter }) {
  const [showPronunciation, setShowPronunciation] = useState(false);
  const [openIds, setOpenIds] = useState<Set<number>>(() => new Set(chapter.duas[0] ? [chapter.duas[0].id] : []));
  async function copy(dua?: CatalogDua) {
    try {
      await navigator.clipboard.writeText(dua ? formatCatalogDua(dua, chapter.title) : chapter.duas.map((entry) => formatCatalogDua(entry, chapter.title)).join("\n\n────────────\n\n"));
      toast.success("কপি করা হয়েছে");
    } catch { toast.error("কপি করা যায়নি। আবার চেষ্টা করুন।"); }
  }
  function toggle(id: number) {
    setOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  return <div className="space-y-4">
    <style>{`@media print { header, nav, aside, .dua-no-print { display:none!important } .catalog-dua-content { display:block!important } .catalog-dua { break-inside:avoid; box-shadow:none!important } .catalog-dua * { color:#000!important } }`}</style>
    <div className="dua-no-print flex flex-wrap items-center gap-2 rounded-2xl border border-hairline bg-surface p-3 text-sm">
      <button type="button" aria-pressed={showPronunciation} onClick={() => setShowPronunciation(!showPronunciation)} className="rounded-xl bg-primary-soft px-3 py-2 font-semibold text-primary">উচ্চারণ {showPronunciation ? "লুকান" : "দেখুন"}</button>
      <button type="button" onClick={() => setOpenIds(new Set(chapter.duas.map((dua) => dua.id)))} className="rounded-xl px-3 py-2 hover:bg-surface-sunken">সব খুলুন</button>
      <button type="button" onClick={() => setOpenIds(new Set())} className="rounded-xl px-3 py-2 hover:bg-surface-sunken">সব বন্ধ করুন</button>
      <button type="button" onClick={() => copy()} className="inline-flex items-center gap-2 rounded-xl border border-hairline px-3 py-2"><Copy className="size-4" />সব কপি</button>
      <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-hairline px-3 py-2"><Printer className="size-4" />প্রিন্ট / PDF</button>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">বাংলা উচ্চারণ আরবি শেখার সহায়ক মাত্র। উৎসে থাকা পাঠ, অনুবাদ, মন্তব্য ও সূত্র সংরক্ষণ করা হয়েছে; সব বর্ণনা একই মানের নয়—দুর্বলতার মন্তব্য থাকলে সেটিও পড়ুন।</p>
    {chapter.duas.map((dua, index) => <article key={dua.id} className="catalog-dua overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
      <div className="flex items-center gap-2 px-4 py-2"><h2 className="min-w-0 flex-1"><button type="button" aria-expanded={openIds.has(dua.id)} aria-controls={`catalog-dua-${dua.id}`} id={`catalog-trigger-${dua.id}`} onClick={() => toggle(dua.id)} className="flex w-full gap-3 rounded-lg py-2 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="text-primary">{bnNum(index + 1)}</span><span className="min-w-0 flex-1">{dua.title}</span><span aria-hidden="true" className="dua-no-print text-primary">{openIds.has(dua.id) ? "−" : "+"}</span></button></h2><button type="button" onClick={() => copy(dua)} aria-label={`${dua.title} কপি করুন`} className="dua-no-print grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-primary-soft hover:text-primary"><Copy className="size-4" /></button></div>
      <div id={`catalog-dua-${dua.id}`} aria-labelledby={`catalog-trigger-${dua.id}`} className={`catalog-dua-content space-y-5 border-t border-hairline px-4 py-4 sm:px-5 ${openIds.has(dua.id) ? "" : "hidden"}`}>
        {dua.segments.map((segment, segmentIndex) => <div key={segmentIndex} className="space-y-3 border-b border-hairline pb-4 last:border-0 last:pb-0">
          {segment.introduction ? <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{segment.introduction}</p> : null}
          {segment.arabic ? <p dir="rtl" lang="ar" className="quran-text rounded-xl bg-primary-soft/40 px-3 py-3 text-right text-2xl leading-[2.1] text-primary sm:text-3xl">{segment.arabic}</p> : null}
          {showPronunciation && segment.pronunciation ? <div className="dua-no-print rounded-xl bg-surface-sunken p-3"><h3 className="mb-1 text-xs font-semibold text-muted-foreground">সহায়ক উচ্চারণ</h3><p className="text-sm leading-relaxed">{segment.pronunciation}</p></div> : null}
          {segment.meaning ? <p className="whitespace-pre-line font-bangla-serif text-base leading-[1.9]">{segment.meaning}</p> : segment.arabic ? <p className="text-xs text-muted-foreground">এই অংশের বাংলা অর্থ উৎসে দেওয়া নেই।</p> : null}
          {segment.note ? <p className="whitespace-pre-line rounded-xl border border-hairline bg-surface-sunken/60 p-3 text-sm leading-relaxed text-muted-foreground">{segment.note}</p> : null}
          {segment.reference ? <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground"><span className="font-semibold text-primary">সূত্র: </span>{segment.reference}</p> : null}
        </div>)}
        {!dua.segments.some((segment) => segment.reference) ? <p className="text-xs text-muted-foreground">এই এন্ট্রির জন্য উৎসে পৃথক দলিল দেওয়া নেই।</p> : null}
        <a href={`https://dua-api.hisnul.workers.dev/api/duas/${dua.id}`} target="_blank" rel="noreferrer" className="dua-no-print inline-block text-xs text-primary underline underline-offset-4">মূল ডেটার সূত্র</a>
      </div>
    </article>)}
  </div>;
}
