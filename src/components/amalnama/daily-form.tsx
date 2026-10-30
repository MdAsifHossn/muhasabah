"use client";

import {
  BookOpenText,
  Check,
  CheckCheck,
  Circle,
  CloudSun,
  Flower2,
  HandHelping,
  Heart,
  Leaf,
  Library,
  Loader2,
  Minus,
  Moon,
  MoonStar,
  PenLine,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { actionErrorMessage } from "@/lib/action-error";
import { saveDailyAmalnama } from "@/lib/actions/amalnama";
import { calculateAmalItemScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export type DailyFormItem = {
  id: string;
  titleBn: string;
  description: string | null;
  category: string;
  categoryLabel: string;
  inputType: "BOOLEAN" | "NUMBER" | "MINUTES" | "PAGES" | "AYAT" | "COUNT" | "TEXT";
  targetValue: number | null;
  unit: string | null;
  points: number;
  genderScope: "ALL" | "MALE" | "FEMALE";
  isFridayOnly: boolean;
  initial: boolean | number | string;
};

export type DailyFormMeta = {
  title: string;
  weekdayLabel: string;
  banglaDate: string;
  hijriDate: string;
  cycleLabel: string;
  isFriday: boolean;
  isExcused: boolean;
};

type Value = boolean | number | string;

const bn = new Intl.NumberFormat("bn-BD");
const toBn = (value: number) => bn.format(Math.round(value * 100) / 100);

/** Each category gets its own hue + icon. Full class strings so Tailwind can see them. */
const CATEGORY_STYLE: Record<string, { icon: LucideIcon; tile: string; text: string; bar: string; ring: string }> = {
  SALAH: { icon: MoonStar, tile: "bg-cat-salah/12 text-cat-salah", text: "text-cat-salah", bar: "bg-cat-salah", ring: "ring-cat-salah/30" },
  JUMUAH: { icon: Sparkles, tile: "bg-cat-jumuah/15 text-cat-jumuah", text: "text-cat-jumuah", bar: "bg-cat-jumuah", ring: "ring-cat-jumuah/35" },
  QURAN: { icon: BookOpenText, tile: "bg-cat-quran/12 text-cat-quran", text: "text-cat-quran", bar: "bg-cat-quran", ring: "ring-cat-quran/30" },
  DHIKR: { icon: Flower2, tile: "bg-cat-dhikr/12 text-cat-dhikr", text: "text-cat-dhikr", bar: "bg-cat-dhikr", ring: "ring-cat-dhikr/30" },
  SUNNAH: { icon: Leaf, tile: "bg-cat-sunnah/12 text-cat-sunnah", text: "text-cat-sunnah", bar: "bg-cat-sunnah", ring: "ring-cat-sunnah/30" },
  CHARACTER: { icon: Heart, tile: "bg-cat-character/12 text-cat-character", text: "text-cat-character", bar: "bg-cat-character", ring: "ring-cat-character/30" },
  SERVICE: { icon: HandHelping, tile: "bg-cat-service/12 text-cat-service", text: "text-cat-service", bar: "bg-cat-service", ring: "ring-cat-service/30" },
  SELF_DISCIPLINE: { icon: ShieldCheck, tile: "bg-cat-discipline/12 text-cat-discipline", text: "text-cat-discipline", bar: "bg-cat-discipline", ring: "ring-cat-discipline/30" },
  READING: { icon: Library, tile: "bg-cat-reading/12 text-cat-reading", text: "text-cat-reading", bar: "bg-cat-reading", ring: "ring-cat-reading/30" },
  OTHER: { icon: Circle, tile: "bg-muted text-muted-foreground", text: "text-muted-foreground", bar: "bg-primary", ring: "ring-border" },
};
const styleOf = (category: string) => CATEGORY_STYLE[category] ?? CATEGORY_STYLE.OTHER;

/** Prayer amals are shown under their waqt, like the printed form. */
const WAQTS: Array<{ label: string; icon: LucideIcon; match: RegExp }> = [
  { label: "ফজর", icon: Sunrise, match: /^(ফজর|ইশরাক)/ },
  { label: "যুহর", icon: Sun, match: /^যুহর/ },
  { label: "আসর", icon: CloudSun, match: /^আসর/ },
  { label: "মাগরিব", icon: Sunset, match: /^মাগরিব/ },
  { label: "ইশা ও তাহাজ্জুদ", icon: Moon, match: /^(ইশা|তাহাজ্জুদ)/ },
];
const waqtOf = (title: string) => WAQTS.find((waqt) => waqt.match.test(title)) ?? null;

function stepFor(item: DailyFormItem) {
  if (item.inputType === "MINUTES") return 5;
  if ((item.targetValue ?? 0) >= 100) return 10;
  return 1;
}

const isDone = (item: DailyFormItem, value: Value | undefined) => calculateAmalItemScore(item, value ?? null) >= item.points;

function Ring({ percent, size, stroke, className, children }: { percent: number; size: number; stroke: number; className?: string; children?: ReactNode }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <span className={cn("relative grid shrink-0 place-items-center", className)} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-current opacity-15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="stroke-current transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </span>
  );
}

export function DailyForm({
  day,
  items,
  personalNote,
  status,
  locked,
  meta,
  excuseSlot,
}: {
  day: "today" | "yesterday";
  items: DailyFormItem[];
  personalNote: string;
  status: "DRAFT" | "SUBMITTED" | "LOCKED" | null;
  locked: boolean;
  meta: DailyFormMeta;
  /** Women only: the discreet শরয়ী ওজর switch, rendered by the page. */
  excuseSlot?: ReactNode;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, Value>>(() => Object.fromEntries(items.map((item) => [item.id, item.initial])));
  const [note, setNote] = useState(personalNote);
  const [dirty, setDirty] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<"draft" | "submit" | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = (id: string, value: Value) => {
    setValues((current) => ({ ...current, [id]: value }));
    setDirty(true);
  };

  const { score, max, doneCount } = useMemo(() => {
    let total = 0;
    let maximum = 0;
    let done = 0;
    for (const item of items) {
      const gained = calculateAmalItemScore(item, values[item.id] ?? null);
      total += gained;
      maximum += item.points;
      if (gained >= item.points) done += 1;
    }
    return { score: total, max: maximum, doneCount: done };
  }, [items, values]);
  const percent = max > 0 ? Math.round((score / max) * 100) : 0;

  // Category → (waqt →) items, keeping the catalogue order.
  const groups = useMemo(() => {
    const result: Array<{ key: string; label: string; sections: Array<{ waqt: (typeof WAQTS)[number] | null; items: DailyFormItem[] }> }> = [];
    for (const item of items) {
      let group = result.find((candidate) => candidate.key === item.category);
      if (!group) {
        group = { key: item.category, label: item.categoryLabel, sections: [] };
        result.push(group);
      }
      const waqt = item.category === "SALAH" ? waqtOf(item.titleBn) : null;
      let section = group.sections.find((candidate) => candidate.waqt?.label === waqt?.label);
      if (!section) {
        section = { waqt, items: [] };
        group.sections.push(section);
      }
      section.items.push(item);
    }
    return result.map((group) => {
      const all = group.sections.flatMap((section) => section.items);
      return { ...group, total: all.length, done: all.filter((item) => isDone(item, values[item.id])).length };
    });
  }, [items, values]);

  function jumpTo(key: string) {
    document.getElementById(`cat-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function save(intent: "draft" | "submit") {
    const formData = new FormData();
    formData.set("intent", intent);
    formData.set("day", day);
    formData.set("personalNote", note);
    for (const item of items) {
      const value = values[item.id];
      if (item.inputType === "BOOLEAN") {
        if (value === true) formData.set(`item_${item.id}`, "on");
      } else formData.set(`item_${item.id}`, String(value ?? ""));
    }
    setPendingIntent(intent);
    startTransition(async () => {
      try {
        await saveDailyAmalnama(formData);
        toast.success(intent === "submit" || status === "SUBMITTED" ? "আমলনামা জমা হয়েছে। জাযাকাল্লাহু খাইরান!" : "খসড়া সংরক্ষিত হয়েছে।");
        setDirty(false);
        router.refresh();
      } catch (error) {
        toast.error(actionErrorMessage(error, "সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।"));
      } finally {
        setPendingIntent(null);
      }
    });
  }

  const statusLine = dirty
    ? "পরিবর্তন সংরক্ষণ হয়নি"
    : status === "SUBMITTED"
      ? "জমা দেওয়া হয়েছে"
      : status === "DRAFT"
        ? "খসড়া সংরক্ষিত"
        : "এখনো সংরক্ষণ হয়নি";

  return (
    <div className="space-y-4">
      {/* ── Summary ── */}
      <section className="hero-surface overflow-hidden rounded-[1.6rem] p-5 shadow-lg sm:p-6">
        <div className="flex items-center gap-5">
          <Ring percent={percent} size={112} stroke={11} className="text-[#f0cf8c]">
            <span className="text-center leading-none">
              <span className="block text-[1.75rem] font-bold tabular-nums text-on-hero">{toBn(percent)}%</span>
              <span className="mt-1 block text-[11px] font-medium text-on-hero-muted">সম্পন্ন</span>
            </span>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              {meta.isFriday ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e3b25a] px-2.5 py-0.5 text-[11px] font-bold text-[#2a1d02]">
                  <Sparkles className="size-3" /> জুমার দিন
                </span>
              ) : null}
              {status === "SUBMITTED" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-on-hero">
                  <CheckCheck className="size-3" /> জমা হয়েছে
                </span>
              ) : null}
              {meta.isExcused ? <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-on-hero-muted">ওজরের দিন</span> : null}
            </div>
            <h1 className="mt-2 text-[1.45rem] font-bold leading-tight sm:text-2xl">{meta.title}</h1>
            <p className="mt-1 text-[13px] leading-5 text-on-hero-muted">
              {meta.weekdayLabel}, {meta.banglaDate}
              <span className="block">{meta.hijriDate}</span>
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-white/[0.07] py-3 text-center ring-1 ring-white/10">
          <div>
            <p className="text-lg font-bold tabular-nums">
              {toBn(doneCount)}
              <span className="text-sm font-medium text-on-hero-muted">/{toBn(items.length)}</span>
            </p>
            <p className="text-[11px] text-on-hero-muted">আমল</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums">
              {toBn(score)}
              <span className="text-sm font-medium text-on-hero-muted">/{toBn(max)}</span>
            </p>
            <p className="text-[11px] text-on-hero-muted">পয়েন্ট</p>
          </div>
          <div>
            <p className="truncate px-1 text-[13px] font-semibold leading-7">{meta.cycleLabel}</p>
            <p className="text-[11px] text-on-hero-muted">মেয়াদ</p>
          </div>
        </div>
        {meta.isExcused ? (
          <p className="mt-3 rounded-xl bg-white/[0.07] px-3 py-2 text-xs leading-5 text-on-hero-muted ring-1 ring-white/10">
            নামাজ ও তিলাওয়াতের আমল এই দিনের হিসাবে ধরা হচ্ছে না।
          </p>
        ) : null}
      </section>

      {excuseSlot}

      {/* ── Category jump chips (sticky under the top bar) ── */}
      <nav
        aria-label="বিভাগ"
        className="no-scrollbar sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-20 -mx-4 flex gap-2 overflow-x-auto bg-background/85 px-4 py-2.5 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-16 lg:mx-0 lg:rounded-2xl lg:px-2"
      >
        {groups.map((group) => {
          const style = styleOf(group.key);
          const complete = group.done === group.total;
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => jumpTo(group.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border bg-card py-1.5 pl-1.5 pr-3 text-[13px] font-semibold shadow-xs transition active:scale-95",
                complete && "border-transparent ring-2",
                complete && style.ring,
              )}
            >
              <Ring percent={(group.done / Math.max(1, group.total)) * 100} size={26} stroke={3} className={style.text}>
                {complete ? <Check className="size-3.5 stroke-[3]" /> : <style.icon className="size-3" />}
              </Ring>
              <span className="text-foreground">{group.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {toBn(group.done)}/{toBn(group.total)}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Category cards ── */}
      {groups.map((group) => {
        const style = styleOf(group.key);
        const complete = group.done === group.total;
        return (
          <section
            key={group.key}
            id={`cat-${group.key}`}
            className={cn("scroll-mt-32 overflow-hidden rounded-card border bg-card shadow-card transition", complete && "ring-2", complete && style.ring)}
          >
            <header className="flex items-center gap-3 px-4 pb-3 pt-4 sm:px-5">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", style.tile)}>
                <style.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-6">{group.label}</h2>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full transition-[width] duration-500", style.bar)} style={{ width: `${(group.done / Math.max(1, group.total)) * 100}%` }} />
                </div>
              </div>
              {complete ? (
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold", style.tile)}>
                  <CheckCheck className="size-3.5" /> সম্পন্ন
                </span>
              ) : (
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  {toBn(group.done)}/{toBn(group.total)}
                </span>
              )}
            </header>

            {group.sections.map((section) => (
              <div key={section.waqt?.label ?? "all"}>
                {section.waqt ? (
                  <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2 sm:px-5">
                    <section.waqt.icon className={cn("size-4", style.text)} />
                    <span className="text-[13px] font-semibold text-foreground">{section.waqt.label}</span>
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {toBn(section.items.filter((item) => isDone(item, values[item.id])).length)}/{toBn(section.items.length)}
                    </span>
                  </div>
                ) : null}
                <ul className="divide-y border-t">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <AmalRow item={item} value={values[item.id]} onChange={(value) => set(item.id, value)} disabled={locked} accent={style} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}

      {/* ── Reflection ── */}
      <section className="rounded-card border bg-card p-4 shadow-card sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-gold-soft text-gold">
            <PenLine className="size-5" />
          </span>
          <div>
            <label htmlFor="personalNote" className="text-base font-semibold">
              আত্মপর্যালোচনা
            </label>
            <p className="text-xs text-muted-foreground">শুধু আপনার জন্য — কী ভালো হলো, কোথায় উন্নতি দরকার</p>
          </div>
        </div>
        <Textarea
          id="personalNote"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setDirty(true);
          }}
          maxLength={2000}
          disabled={locked}
          className="mt-3 min-h-24 font-bangla-serif text-[15px] leading-7"
          placeholder="আজকের দিনটি নিয়ে দু-এক লাইন…"
        />
      </section>

      {/* ── Sticky save bar (above the mobile bottom nav) ── */}
      {!locked ? (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+68px)] z-30 lg:bottom-4">
          <div className="flex items-center gap-3 rounded-2xl border bg-popover/95 p-2.5 pl-3 shadow-xl backdrop-blur-xl">
            <Ring percent={percent} size={46} stroke={5} className="text-primary">
              <span className="text-[11px] font-bold tabular-nums text-foreground">{toBn(percent)}%</span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{toBn(doneCount)}/{toBn(items.length)} আমল</p>
              <p className={cn("truncate text-xs", dirty ? "text-warning" : "text-muted-foreground")}>{dirty ? statusLine : `${toBn(score)} পয়েন্ট • ${statusLine}`}</p>
            </div>
            {status !== "SUBMITTED" ? (
              <Button type="button" variant="outline" size="icon" aria-label="খসড়া রাখুন" title="খসড়া রাখুন" disabled={isPending} onClick={() => save("draft")}>
                {pendingIntent === "draft" ? <Loader2 className="animate-spin" /> : <Save />}
              </Button>
            ) : null}
            <Button type="button" disabled={isPending} onClick={() => save("submit")} className="px-4">
              {pendingIntent === "submit" ? <Loader2 className="animate-spin" /> : status === "SUBMITTED" ? <CheckCheck /> : <Send />}
              {status === "SUBMITTED" ? "আপডেট" : "জমা দিন"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AmalRow({
  item,
  value,
  onChange,
  disabled,
  accent,
}: {
  item: DailyFormItem;
  value: Value | undefined;
  onChange: (value: Value) => void;
  disabled: boolean;
  accent: (typeof CATEGORY_STYLE)[string];
}) {
  if (item.inputType === "BOOLEAN") {
    const checked = value === true;
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="group flex min-h-[3.75rem] w-full items-center gap-3.5 px-4 py-3 text-left transition-colors hover:bg-muted/40 active:bg-muted disabled:cursor-not-allowed sm:px-5"
      >
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border-2 transition-all duration-300",
            checked ? cn("scale-100 border-transparent text-white shadow-sm", accent.bar) : "scale-95 border-border-strong bg-card group-active:scale-90",
          )}
        >
          {checked ? <Check className="size-[18px] animate-fade stroke-[3]" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[15px] leading-6 transition-colors", checked ? "font-medium text-foreground" : "text-foreground/85")}>{item.titleBn}</span>
          {item.description ? <span className="block text-xs leading-5 text-muted-foreground">{item.description}</span> : null}
        </span>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", checked ? accent.tile : "text-subtle-foreground")}>
          +{toBn(item.points)}
        </span>
      </button>
    );
  }

  if (item.inputType === "TEXT") {
    return (
      <div className="space-y-2 px-4 py-3 sm:px-5">
        <p className="text-[15px] font-medium">{item.titleBn}</p>
        <Textarea value={String(value ?? "")} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-h-20" placeholder="সংক্ষেপে লিখুন…" />
      </div>
    );
  }

  const numeric = typeof value === "number" ? value : Number(value) || 0;
  const step = stepFor(item);
  const target = item.targetValue ?? 0;
  const reached = target > 0 && numeric >= target;
  const ratio = target > 0 ? Math.min(1, numeric / target) : numeric > 0 ? 1 : 0;
  return (
    <div className="px-4 py-3.5 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[15px] font-medium leading-6">{item.titleBn}</p>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", reached ? accent.tile : "text-subtle-foreground")}>
          +{toBn(item.points)}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="কমান"
          disabled={disabled || numeric <= 0}
          onClick={() => onChange(Math.max(0, numeric - step))}
          className="grid size-12 shrink-0 place-items-center rounded-2xl border bg-card text-foreground transition active:scale-90 disabled:opacity-35"
        >
          <Minus className="size-5" />
        </button>
        <label className="flex h-12 min-w-0 flex-1 items-baseline justify-center gap-1.5 rounded-2xl bg-muted px-3 pt-2.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={numeric === 0 ? "" : numeric}
            placeholder="0"
            disabled={disabled}
            onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
            aria-label={item.titleBn}
            className="w-16 min-w-0 bg-transparent text-right text-xl font-bold tabular-nums text-foreground outline-none placeholder:text-subtle-foreground [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground">
            {target > 0 ? `/ ${toBn(target)} ` : ""}
            {item.unit}
          </span>
        </label>
        <button
          type="button"
          aria-label="বাড়ান"
          disabled={disabled}
          onClick={() => onChange(numeric + step)}
          className={cn("grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-sm transition active:scale-90 disabled:opacity-35", accent.bar)}
        >
          <Plus className="size-5" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-[width] duration-500", accent.bar)} style={{ width: `${ratio * 100}%` }} />
        </div>
        {target > 0 ? (
          reached ? (
            <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", accent.text)}>
              <CheckCheck className="size-3.5" /> লক্ষ্য পূরণ
            </span>
          ) : (
            <button type="button" disabled={disabled} onClick={() => onChange(target)} className={cn("text-xs font-semibold underline-offset-4 hover:underline", accent.text)}>
              লক্ষ্য পূরণ
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}
