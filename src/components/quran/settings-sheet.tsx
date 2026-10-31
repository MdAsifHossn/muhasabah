"use client";

import { Check } from "lucide-react";

import { optionClass, Sheet } from "@/components/quran/sheet";
import type { ReaderPrefs } from "@/components/quran/storage";
import { READER_THEMES, readerThemeStyle } from "@/components/quran/themes";
import {
  ARABIC_PX,
  BANGLA_PX,
  RECITERS,
  type QuranScript,
  type ViewMode,
} from "@/components/quran/types";
import { bnNum, cleanIndoPakAyahEnd } from "@/lib/quran";
import { cn } from "@/lib/utils";

/** Surah Al-Ikhlas (112) in both scripts — copied verbatim from the same APIs the reader uses. */
const PREVIEW: Record<QuranScript, string> = {
  indopak:
    "قُلْ هُوَ اللّٰهُ اَحَدٌ ۟ۚ اَللّٰهُ الصَّمَدُ ۟ۚ لَمْ یَلِدْ ۙ۬ وَلَمْ یُوْلَدْ ۟ۙ وَلَمْ یَكُنْ لَّهٗ كُفُوًا اَحَدٌ ۟۠",
  uthmani:
    "قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ",
};
const PREVIEW_BN = "বলুন, তিনি আল্লাহ, এক, আল্লাহ অমুখাপেক্ষী,";

const SCRIPTS: { value: QuranScript; label: string; hint: string }[] = [
  { value: "indopak", label: "ইন্দো-পাক", hint: "আমাদের দেশের কুরআনের লিপি" },
  { value: "uthmani", label: "উসমানী", hint: "মদীনার মুসহাফের লিপি" },
];

const VIEW_MODES: { value: ViewMode; label: string; hint: string }[] = [
  { value: "both", label: "আরবি ও বাংলা", hint: "আরবি তিলাওয়াত ও বাংলা অর্থ" },
  { value: "bangla", label: "শুধু বাংলা", hint: "আয়াত ধরে শুধু বাংলা অনুবাদ" },
  { value: "mushaf", label: "মুসহাফ", hint: "কুরআনের পাতার মতো টানা আরবি" },
  {
    value: "arabic",
    label: "শুধু আরবি",
    hint: "আয়াত ধরে শুধু আরবি তিলাওয়াত",
  },
];

const SPEEDS = [0.75, 1, 1.25, 1.5];
const REPEATS = [1, 2, 3, 5];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-xs font-bold tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Range slider with the value shown on the thumb side (like a reader app). */
function SizeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const percent = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-sm font-semibold">{label}</span>
      <span className="text-xs text-muted-foreground" aria-hidden>
        অ
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`${label} — অক্ষরের আকার`}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 flex-1 cursor-pointer appearance-none rounded-full accent-primary"
        style={{
          background: `linear-gradient(to right, var(--primary) ${percent}%, var(--muted) ${percent}%)`,
        }}
      />
      <span className="text-lg font-semibold text-muted-foreground" aria-hidden>
        অ
      </span>
      <span className="grid h-8 min-w-10 place-items-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">
        {bnNum(value)}
      </span>
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
  const showTranslation = prefs.view === "both" || prefs.view === "bangla";
  const showArabic = prefs.view !== "bangla";

  return (
    <Sheet open={open} onClose={onClose} title="কুরআন পড়ার সেটিংস">
      <div className="space-y-6">
        {/* ── Live preview in the chosen theme / script / size ── */}
        <div
          style={readerThemeStyle(prefs.theme)}
          className="overflow-hidden rounded-2xl border bg-card px-4 py-4 text-foreground"
          data-script={prefs.script}
        >
          {showArabic ? (
            <p
              dir="rtl"
              lang="ar"
              className="quran-text text-right"
              style={{ fontSize: prefs.arabicPx }}
            >
              {prefs.script === "indopak"
                ? PREVIEW.indopak
                    .split(/(?<=۟[ۖ-ۭ]*)\s+/u)
                    .map(cleanIndoPakAyahEnd)
                    .join(" ")
                : PREVIEW.uthmani}
            </p>
          ) : null}
          {showTranslation ? (
            <p
              className={cn(
                "font-bangla-serif leading-[1.9] text-muted-foreground",
                showArabic && "mt-2 border-t pt-2",
              )}
              style={{ fontSize: prefs.banglaPx }}
            >
              {PREVIEW_BN}
            </p>
          ) : null}
        </div>

        <Section title="পড়ার ধরন">
          <div className="grid grid-cols-2 gap-2">
            {VIEW_MODES.map((mode) => {
              const active = prefs.view === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => onChange({ view: mode.value })}
                  className={cn(
                    optionClass(active),
                    "flex items-center justify-between gap-2 text-left",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{mode.label}</span>
                    <span className="block text-[11px] font-normal opacity-75">
                      {mode.hint}
                    </span>
                  </span>
                  {active ? (
                    <Check className="size-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="অক্ষরের আকার">
          {showArabic ? (
            <SizeSlider
              label="আরবি"
              value={prefs.arabicPx}
              min={ARABIC_PX.min}
              max={ARABIC_PX.max}
              step={ARABIC_PX.step}
              onChange={(value) => onChange({ arabicPx: value })}
            />
          ) : null}
          {showTranslation ? (
            <SizeSlider
              label="অনুবাদ"
              value={prefs.banglaPx}
              min={BANGLA_PX.min}
              max={BANGLA_PX.max}
              step={BANGLA_PX.step}
              onChange={(value) => onChange({ banglaPx: value })}
            />
          ) : (
            <p className="rounded-xl border border-hairline bg-surface-sunken/60 px-3.5 py-2.5 text-xs text-muted-foreground">
              বাংলা অনুবাদ পড়তে উপরের পড়ার ধরনের{" "}
              <strong className="font-semibold text-foreground">
                আরবি ও বাংলা
              </strong>{" "}
              বা{" "}
              <strong className="font-semibold text-foreground">
                শুধু বাংলা
              </strong>{" "}
              নির্বাচন করুন।
            </p>
          )}
        </Section>

        <Section title="পাতার রং">
          <div className="no-scrollbar -mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {READER_THEMES.map((theme) => {
              const active = prefs.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onChange({ theme: theme.id })}
                  aria-pressed={active}
                  className={cn(
                    "w-[5.5rem] shrink-0 rounded-2xl border-2 p-1.5 text-center transition",
                    active
                      ? "border-primary"
                      : "border-transparent hover:border-border-strong",
                  )}
                >
                  <span
                    className="relative block h-16 overflow-hidden rounded-xl ring-1 ring-black/10"
                    style={{ background: theme.swatch }}
                  >
                    <span className="absolute inset-x-3 top-4 h-0.5 rounded-full bg-emerald-500/80" />
                    <span
                      className="absolute inset-x-3 top-7 h-1 rounded-full opacity-80"
                      style={{ background: theme.ink }}
                    />
                    <span
                      className="absolute inset-x-5 top-10 h-1 rounded-full opacity-60"
                      style={{ background: theme.ink }}
                    />
                    {active ? (
                      <span className="absolute bottom-1 right-1 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block truncate text-[11px] font-semibold">
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="কুরআনের লিপি">
          <div className="grid grid-cols-2 gap-2">
            {SCRIPTS.map((script) => (
              <button
                key={script.value}
                type="button"
                onClick={() => onChange({ script: script.value })}
                className={cn(
                  optionClass(prefs.script === script.value),
                  "flex items-center justify-between gap-2 text-left",
                )}
              >
                <span>
                  <span className="block font-semibold">{script.label}</span>
                  <span className="block text-[11px] font-normal opacity-75">
                    {script.hint}
                  </span>
                </span>
                {prefs.script === script.value ? (
                  <Check className="size-4 shrink-0 text-primary" />
                ) : null}
              </button>
            ))}
          </div>
        </Section>

        <Section title="তিলাওয়াত">
          <div className="space-y-1.5">
            {RECITERS.map((reciter) => (
              <button
                key={reciter.id}
                type="button"
                onClick={() => onChange({ reciter: reciter.id })}
                className={cn(
                  optionClass(prefs.reciter === reciter.id),
                  "flex w-full items-center justify-between text-left",
                )}
              >
                {reciter.name}
                {prefs.reciter === reciter.id ? (
                  <Check className="size-4" />
                ) : null}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                গতি
              </p>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
                {SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => onChange({ speed })}
                    className={cn(
                      "h-9 rounded-lg text-xs font-bold transition",
                      prefs.speed === speed
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {bnNum(speed)}x
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground">
                প্রতি আয়াত পুনরাবৃত্তি
              </p>
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
                {REPEATS.map((repeat) => (
                  <button
                    key={repeat}
                    type="button"
                    onClick={() => onChange({ repeat })}
                    className={cn(
                      "h-9 rounded-lg text-xs font-bold transition",
                      prefs.repeat === repeat
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground",
                    )}
                  >
                    {bnNum(repeat)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </Sheet>
  );
}
