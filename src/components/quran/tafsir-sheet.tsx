"use client";

import {
  BookOpenText,
  Check,
  Copy,
  Loader2,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import type { ReaderAyah } from "@/components/quran/types";
import { bnNum, shortBanglaName, SURAH_LIST } from "@/lib/quran";
import { cn } from "@/lib/utils";

export const TAFSIR_OPTIONS = [
  { id: 166, label: "আবু বকর জাকারিয়া", fullName: "তাফসীর আবু বকর জাকারিয়া" },
  { id: 164, label: "ইবনে কাসীর", fullName: "তাফসীর ইবনে কাসীর" },
  { id: 165, label: "আহসানুল বায়ান", fullName: "তাফসীর আহসানুল বায়ান" },
] as const;

type TafsirId = (typeof TAFSIR_OPTIONS)[number]["id"];

type TafsirData = {
  surah: number;
  ayah: number;
  tafsirId: number;
  tafsirName: string;
  text: string;
};

export function TafsirSheet({
  ayah,
  onClose,
}: {
  ayah: ReaderAyah | null;
  onClose: () => void;
}) {
  const [selectedTafsir, setSelectedTafsir] = useState<TafsirId>(166);
  const [data, setData] = useState<TafsirData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(17);
  const [copied, setCopied] = useState(false);

  // In-memory cache for fast tab switching: key = "surah:ayah:tafsirId"
  const cacheRef = useRef<Map<string, TafsirData>>(new Map());

  const surahMeta = ayah ? SURAH_LIST[ayah.surahNumber - 1] : null;
  const surahLabel = surahMeta ? shortBanglaName(surahMeta) : (ayah ? ayah.surahName : "সূরা");
  const title = ayah
    ? `${surahLabel} • আয়াত ${bnNum(ayah.numberInSurah)}`
    : "তাফসীর";

  useEffect(() => {
    if (!ayah) {
      setData(null);
      setError(null);
      return;
    }

    const key = `${ayah.surahNumber}:${ayah.numberInSurah}:${selectedTafsir}`;
    const cached = cacheRef.current.get(key);
    if (cached) {
      setData(cached);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(
      `/api/quran/tafsir?surah=${ayah.surahNumber}&ayah=${ayah.numberInSurah}&id=${selectedTafsir}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "তাফসীর লোড করা যায়নি");
        }
        return res.json() as Promise<TafsirData>;
      })
      .then((resData) => {
        cacheRef.current.set(key, resData);
        setData(resData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== "AbortError") {
          setError((err as Error)?.message || "তাফসীর লোড করা যায়নি");
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [ayah, selectedTafsir]);

  async function handleCopy() {
    if (!data?.text) return;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.text, "text/html");
      const plainText = doc.body.textContent || "";
      const textToCopy = `${title}\n${data.tafsirName}\n\n${plainText.trim()}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("তাফসীর কপি করা হয়েছে");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("কপি করা যায়নি");
    }
  }

  function handleRetry() {
    if (!ayah) return;
    const key = `${ayah.surahNumber}:${ayah.numberInSurah}:${selectedTafsir}`;
    cacheRef.current.delete(key);
    setData(null);
    setLoading(true);
    setError(null);

    fetch(
      `/api/quran/tafsir?surah=${ayah.surahNumber}&ayah=${ayah.numberInSurah}&id=${selectedTafsir}`,
    )
      .then((res) => res.json() as Promise<TafsirData>)
      .then((resData) => {
        cacheRef.current.set(key, resData);
        setData(resData);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError((err as Error)?.message || "তাফসীর লোড করা যায়নি");
        setLoading(false);
      });
  }

  return (
    <ResponsiveSheet
      open={ayah !== null}
      onClose={onClose}
      title={title}
      description={ayah ? `পারা ${bnNum(ayah.page ? Math.ceil(ayah.page / 20) : 1)}` : undefined}
      className="sm:max-w-2xl lg:max-w-3xl"
    >
      {ayah ? (
        <div className="space-y-4">
          {/* ── Ayah Summary Card ── */}
          <div className="rounded-2xl border border-hairline bg-surface-sunken/80 p-3.5 sm:p-4">
            <p
              dir="rtl"
              lang="ar"
              className="quran-text text-right text-xl leading-relaxed text-foreground sm:text-2xl"
            >
              {ayah.arabic}
            </p>
            {ayah.bangla ? (
              <p className="mt-2.5 border-t border-hairline pt-2.5 font-bangla-serif text-sm leading-relaxed text-muted-foreground sm:text-base">
                {ayah.bangla}
              </p>
            ) : null}
          </div>

          {/* ── Tafsir Selector Tabs & Controls ── */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline pb-3">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="তাফসীর গ্রন্থ">
              {TAFSIR_OPTIONS.map((opt) => {
                const active = selectedTafsir === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedTafsir(opt.id)}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                      active
                        ? "bg-active text-on-active shadow-sm"
                        : "bg-surface-sunken text-muted-foreground hover:bg-surface hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Font size + Copy controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.max(14, s - 1.5))}
                disabled={fontSize <= 14}
                title="ছোট ফন্ট"
                aria-label="ফন্টের আকার কমান"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground disabled:opacity-40"
              >
                <ZoomOut className="size-4" />
              </button>
              <span className="w-8 text-center text-xs font-bold tabular-nums text-muted-foreground">
                {bnNum(Math.round(fontSize))}
              </span>
              <button
                type="button"
                onClick={() => setFontSize((s) => Math.min(26, s + 1.5))}
                disabled={fontSize >= 26}
                title="বড় ফন্ট"
                aria-label="ফন্টের আকার বাড়ান"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground disabled:opacity-40"
              >
                <ZoomIn className="size-4" />
              </button>
              <div className="mx-1 h-4 w-px bg-hairline" />
              <button
                type="button"
                onClick={handleCopy}
                disabled={!data?.text}
                title="তাফসীর কপি করুন"
                aria-label="তাফসীর কপি করুন"
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground disabled:opacity-40"
              >
                {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>

          {/* ── Tafsir Body ── */}
          <div className="min-h-[220px]">
            {loading ? (
              <div className="space-y-3 py-6">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  <span>তাফসীর লোড হচ্ছে…</span>
                </div>
                <div className="h-4 w-3/4 animate-pulse rounded bg-surface-sunken" />
                <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-surface-sunken" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-surface-sunken" />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-warning/20 bg-warning-soft p-5 text-center">
                <p className="text-sm font-semibold text-warning">{error}</p>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-surface px-4 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:bg-surface-sunken"
                >
                  <RefreshCw className="size-3.5" /> আবার চেষ্টা করুন
                </button>
              </div>
            ) : data?.text ? (
              <div
                className="font-bangla-serif leading-[2.1] text-foreground/90 transition-all [&_b]:font-bold [&_b]:text-foreground [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-bold [&_p]:mb-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: data.text }}
              />
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <BookOpenText className="mx-auto size-8 opacity-40" />
                <p className="mt-2 text-sm">এই আয়াতের জন্য আলাদা কোনো তাফসীর পাওয়া যায়নি।</p>
                <p className="mt-1 text-xs">অন্য তাফসীর গ্রন্থ নির্বাচন করে দেখতে পারেন।</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </ResponsiveSheet>
  );
}
