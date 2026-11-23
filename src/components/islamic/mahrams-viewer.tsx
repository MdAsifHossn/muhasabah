"use client";

import { Search, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { filterMahramRelations, MAHRAM_SOURCES, type MahramAudience, type MahramStatus } from "@/lib/mahrams";
import { bnNum } from "@/lib/quran";
import { SegmentIndicator } from "@/components/ui/segment-indicator";
import { cn } from "@/lib/utils";

const STATUSES = { all: "সব সম্পর্ক", mahram: "মাহরাম", "non-mahram": "গায়রে মাহরাম", conditional: "শর্তসাপেক্ষ", spouse: "স্বামী / স্ত্রী" } as const;
const STATUS_COLORS = { mahram: "bg-success-soft text-success", "non-mahram": "bg-surface-sunken text-foreground", conditional: "bg-warning-soft text-warning", spouse: "bg-primary-soft text-primary" };

export function MahramsViewer() {
  const [audience, setAudience] = useState<MahramAudience>("men");
  const [status, setStatus] = useState<MahramStatus | "all">("all");
  const [query, setQuery] = useState("");
  const relations = filterMahramRelations(audience, status, query);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/15 bg-linear-to-br from-primary-soft to-surface p-4 sm:p-5">
        <div className="flex gap-3"><ShieldCheck className="mt-1 size-6 shrink-0 text-primary" /><div><h2 className="text-base font-bold text-primary">সম্পর্ক বুঝি, সীমারেখা জানি</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">মাহরাম হলেন যাঁর সঙ্গে বিবাহ স্থায়ীভাবে নিষিদ্ধ। সাময়িক বিবাহ-নিষেধ, একসঙ্গে বড় হওয়া বা পারিবারিক ঘনিষ্ঠতা কাউকে মাহরাম করে না। স্বামী-স্ত্রীর সম্পর্ক আলাদা করে দেখানো হয়েছে।</p></div></div>
      </div>
      <div className="space-y-4 rounded-2xl border border-hairline bg-surface p-3 sm:p-4">
        <div role="group" aria-label="কার জন্য সম্পর্ক দেখবেন" className="relative grid grid-cols-2 rounded-xl bg-surface-sunken p-1"><SegmentIndicator count={2} index={audience === "men" ? 0 : 1} />
          {([ ["men", "পুরুষের জন্য"], ["women", "নারীর জন্য"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={audience === value} onClick={() => setAudience(value)} className={cn("relative z-10 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors duration-300", audience === value ? "text-on-active" : "text-muted-foreground hover:text-foreground")}>{label}</button>)}
        </div>
        <label className="relative block"><Search aria-hidden="true" className="absolute left-3 top-3 size-4 text-muted-foreground" /><span className="sr-only">সম্পর্ক খুঁজুন</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="সম্পর্ক খুঁজুন: খালা, ভাবী, দেবর…" className="h-11 w-full rounded-xl border border-hairline bg-surface-sunken pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" /></label>
        <div role="group" aria-label="সম্পর্কের ধরন" className="flex flex-wrap gap-2">{Object.entries(STATUSES).map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value as typeof status)} className={cn("rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors", status === value ? "bg-active text-on-active shadow-sm" : "bg-surface-sunken text-muted-foreground hover:text-foreground")}>{label}</button>)}</div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">{bnNum(relations.length)}টি সম্পর্কের শ্রেণি · {audience === "men" ? "পুরুষের" : "নারীর"} দৃষ্টিকোণ থেকে</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {relations.map((relation) => {
          const source = MAHRAM_SOURCES.find((entry) => entry.id === relation.source)!;
          return <article key={relation.id} className="rounded-2xl border border-hairline bg-surface p-4 shadow-card"><div className="flex items-start justify-between gap-3"><UsersRound aria-hidden="true" className="size-5 shrink-0 text-primary" /><span className={cn("rounded-lg px-2.5 py-1 text-xs font-semibold", STATUS_COLORS[relation.status])}>{STATUSES[relation.status]}</span></div><h3 className="mt-3 text-base font-bold">{relation.name}</h3><p className="mt-1 text-xs text-muted-foreground">{relation.category}</p>{relation.note ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{relation.note}</p> : null}<p className="mt-3 border-t border-hairline pt-2 text-xs font-medium text-primary">{source.label}{relation.status === "non-mahram" ? " · সাধারণ ভিত্তি" : ""}</p></article>;
        })}
      </div>
      {relations.length === 0 ? <p className="rounded-2xl border border-hairline p-6 text-center text-sm text-muted-foreground">কোনো সম্পর্ক মেলেনি। অন্য শব্দ বা ধরন বাছুন।</p> : null}
      <div className="space-y-2 rounded-2xl border border-hairline bg-surface-sunken p-4 text-sm leading-relaxed text-muted-foreground"><h3 className="font-bold text-foreground">শর্তগুলো মনে রাখুন</h3><p>দুধসম্পর্কের বয়স, পরিমাণ ও প্রমাণ নিয়ে ফিকহি শর্ত ও মতভেদ আছে। শুধু “দুধভাই” বলা বা একবার দুধ খাওয়ার কথা শোনা থেকে চূড়ান্ত সিদ্ধান্ত নেবেন না। জটিল সম্পর্কের ক্ষেত্রে যোগ্য আলেমের কাছে বিস্তারিত জানিয়ে নিশ্চিত হোন।</p><p>এই তালিকা সম্পর্ক চেনার সহায়িকা। মাহরাম হলেও শালীনতা ও ব্যক্তিগত নিরাপত্তার সীমা বজায় থাকে।</p></div>
    </div>
  );
}
