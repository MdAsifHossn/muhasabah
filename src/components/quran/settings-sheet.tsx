"use client";

import { Check, Minus, Moon, Plus, ScrollText, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { optionClass, Sheet } from "@/components/quran/sheet";
import type { ReaderPrefs } from "@/components/quran/storage";
import { ARABIC_STEPS, BANGLA_STEPS, RECITERS, type ViewMode } from "@/components/quran/types";
import { BISMILLAH } from "@/lib/quran";
import { cn } from "@/lib/utils";

const VIEWS: { value: ViewMode; label: string; hint: string }[] = [
  { value: "both", label: "আরবি + অর্থ", hint: "আয়াতভিত্তিক কার্ড" },
  { value: "mushaf", label: "মুসহাফ", hint: "টানা আরবি পাঠ" },
  { value: "arabic", label: "শুধু আরবি", hint: "কার্ড, অর্থ ছাড়া" },
  { value: "bangla", label: "শুধু অর্থ", hint: "বাংলা অনুবাদ" },
];

function Stepper({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-1 rounded-xl border border-hairline bg-surface-sunken p-1">
        <button type="button" aria-label={`${label} ছোট`} disabled={value <= 0} onClick={() => onChange(value - 1)} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface disabled:opacity-40">
          <Minus className="size-4" />
        </button>
        <div className="flex gap-1 px-1" aria-hidden>
          {Array.from({ length: max + 1 }, (_, index) => (
            <span key={index} className={cn("h-2 w-2 rounded-full", index <= value ? "bg-primary" : "bg-hairline-strong")} />
          ))}
        </div>
        <button type="button" aria-label={`${label} বড়`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-surface disabled:opacity-40">
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SettingsSheet({
  open,
  onClose,
  prefs,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  prefs: ReaderPrefs;
  onChange: (patch: Partial<ReaderPrefs>) => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const appearance = prefs.theme === "sepia" ? "sepia" : resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Sheet open={open} onClose={onClose} title="পড়ার সেটিংস">
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground">পড়ার ধরন</h3>
          <div className="grid grid-cols-2 gap-2">
            {VIEWS.map((view) => (
              <button key={view.value} type="button" onClick={() => onChange({ view: view.value })} className={cn(optionClass(prefs.view === view.value), "text-left")}>
                <span className="block">{view.label}</span>
                <span className="block text-[11px] font-normal opacity-75">{view.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-xs font-bold tracking-wide text-muted-foreground">অক্ষরের আকার</h3>
          <Stepper label="আরবি" value={prefs.arabicStep} max={ARABIC_STEPS.length - 1} onChange={(value) => onChange({ arabicStep: value })} />
          <Stepper label="বাংলা অর্থ" value={prefs.banglaStep} max={BANGLA_STEPS.length - 1} onChange={(value) => onChange({ banglaStep: value })} />
          <div className="rounded-xl border border-hairline bg-surface-sunken p-3">
            <p dir="rtl" lang="ar" className="quran-text text-center" style={{ fontSize: ARABIC_STEPS[prefs.arabicStep] }}>
              {BISMILLAH}
            </p>
            <p className="text-center font-bangla-serif text-muted-foreground" style={{ fontSize: BANGLA_STEPS[prefs.banglaStep] }}>
              পরম করুণাময় অতি দয়ালু আল্লাহর নামে
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground">পাতার রং</h3>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => { onChange({ theme: "app" }); setTheme("light"); }} className={optionClass(appearance === "light")}>
              <Sun className="mx-auto size-4" /> আলো
            </button>
            <button type="button" onClick={() => onChange({ theme: "sepia" })} className={optionClass(appearance === "sepia")}>
              <ScrollText className="mx-auto size-4" /> সেপিয়া
            </button>
            <button type="button" onClick={() => { onChange({ theme: "app" }); setTheme("dark"); }} className={optionClass(appearance === "dark")}>
              <Moon className="mx-auto size-4" /> রাত
            </button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold tracking-wide text-muted-foreground">ক্বারী</h3>
          <div className="space-y-1.5">
            {RECITERS.map((reciter) => (
              <button
                key={reciter.id}
                type="button"
                onClick={() => onChange({ reciter: reciter.id })}
                className={cn(optionClass(prefs.reciter === reciter.id), "flex w-full items-center justify-between text-left")}
              >
                {reciter.name}
                {prefs.reciter === reciter.id ? <Check className="size-4" /> : null}
              </button>
            ))}
          </div>
        </section>
      </div>
    </Sheet>
  );
}
