"use client";

import {
  AlertCircle,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  Hash,
  Loader2,
  MapPin,
  Pause,
  Play,
  RefreshCw,
  Settings2,
  Share2,
  SkipBack,
  SkipForward,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { toast } from "sonner";

import { SettingsSheet } from "@/components/quran/settings-sheet";
import { Sheet } from "@/components/quran/sheet";
import { saveLastRead, useBookmarks, usePrefs } from "@/components/quran/storage";
import { SurahHeader } from "@/components/quran/surah-header";
import { ARABIC_STEPS, BANGLA_STEPS, RECITERS, stepToFontSize, type Mode, type QuranPayload, type ReaderAyah } from "@/components/quran/types";
import { bnNum, shortBanglaName, stripBismillah, SURAH_LIST } from "@/lib/quran";
import { TOTAL_AYAHS } from "@/lib/quran-progress";
import { cn } from "@/lib/utils";

const MAX_ID: Record<Mode, number> = { surah: 114, juz: 30 };
const SAVE_DEBOUNCE_MS = 1600;
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (value: number) => String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);

/** Sepia reading paper — overrides the colour tokens for the reader subtree only. */
const SEPIA: CSSProperties = {
  ["--background" as string]: "#f3e9d2",
  ["--surface" as string]: "#fbf4e3",
  ["--surface-raised" as string]: "#fdf8ec",
  ["--surface-sunken" as string]: "#efe3c6",
  ["--foreground" as string]: "#3a2e1c",
  ["--muted-foreground" as string]: "#76664a",
  ["--subtle-foreground" as string]: "#a0906f",
  ["--hairline" as string]: "#e5d6b3",
  ["--hairline-strong" as string]: "#d6c398",
  ["--primary" as string]: "#8a5a14",
  ["--primary-hover" as string]: "#6f480f",
  ["--primary-soft" as string]: "#efe0bb",
  ["--primary-soft-foreground" as string]: "#6f480f",
  ["--on-primary" as string]: "#ffffff",
  colorScheme: "light",
};

type Props = { mode: Mode; id: number; initialSurah?: number; initialAyah?: number; isLoggedIn: boolean };

export function QuranReader({ mode, id, initialSurah, initialAyah, isLoggedIn }: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = usePrefs();
  const [bookmarks, toggleBookmark] = useBookmarks();
  const reciter = RECITERS.some((item) => item.id === prefs.reciter) ? prefs.reciter : RECITERS[0].id;

  const [ayahs, setAyahs] = useState<ReaderAyah[]>([]);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const requestKey = `${mode}/${id}/${reciter}/${reload}`;

  const [current, setCurrent] = useState<number | null>(null); // index into ayahs
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [actionAyah, setActionAyah] = useState<ReaderAyah | null>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const continuousRef = useRef(true);
  const ayahsRef = useRef<ReaderAyah[]>([]);
  useEffect(() => {
    ayahsRef.current = ayahs;
  }, [ayahs]);

  /* ── Load the surah / juz ─────────────────────────────────────────── */
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/quran/${mode}/${id}?reciter=${encodeURIComponent(reciter)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.json() as Promise<QuranPayload>;
      })
      .then((data) => {
        if (!Array.isArray(data.ayahs) || data.ayahs.length === 0) throw new Error("empty");
        setAyahs(
          data.ayahs.map((ayah) => ({
            ...ayah,
            // Also cleans payloads cached by the service worker before the fix.
            arabic: stripBismillah(ayah.arabic, ayah.surahNumber, ayah.numberInSurah),
            surahName: SURAH_LIST[ayah.surahNumber - 1]?.banglaName ?? ayah.surahName,
          })),
        );
        setFailedKey(null);
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name !== "AbortError") setFailedKey(requestKey);
      });
    return () => controller.abort();
  }, [mode, id, reciter, requestKey]);

  const failed = failedKey === requestKey && ayahs.length === 0;
  const loading = ayahs.length === 0 && !failed;

  /* ── Jump to the requested ayah once loaded ───────────────────────── */
  const jumped = useRef(false);
  useEffect(() => {
    if (jumped.current || ayahs.length === 0) return;
    jumped.current = true;
    const surah = initialSurah ?? (mode === "surah" ? id : ayahs[0].surahNumber);
    if (!initialAyah || initialAyah <= 1) return;
    requestAnimationFrame(() => {
      document.getElementById(`a-${surah}-${initialAyah}`)?.scrollIntoView({ block: "start" });
    });
  }, [ayahs, initialAyah, initialSurah, mode, id]);

  /* ── Reading position, read coverage, debounced sync ──────────────── */
  const topRef = useRef<ReaderAyah | null>(null);
  const pendingRead = useRef(new Set<number>());
  const seen = useRef(new Set<number>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
  }, [prefs]);

  const flush = useCallback(
    (keepalive = false) => {
      const top = topRef.current;
      if (!top) return;
      saveLastRead({ mode, id, surah: top.surahNumber, ayah: top.numberInSurah });
      if (!isLoggedIn) return;
      const newRead = Array.from(pendingRead.current);
      const body = {
        mode,
        surah: top.surahNumber,
        juz: mode === "juz" ? id : null,
        ayahInSurah: top.numberInSurah,
        globalAyah: top.number,
        viewMode: prefsRef.current.view,
        fontSize: stepToFontSize(prefsRef.current.arabicStep),
        reciter: prefsRef.current.reciter,
        newRead,
      };
      fetch("/api/quran/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive })
        .then((response) => {
          if (response.ok) for (const number of newRead) pendingRead.current.delete(number);
        })
        .catch(() => undefined);
    },
    [isLoggedIn, mode, id],
  );

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      flush();
    }, SAVE_DEBOUNCE_MS);
  }, [flush]);

  const scan = useCallback(() => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    setScrollPercent(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    const list = ayahsRef.current;
    if (list.length === 0) return;
    const nodes = document.querySelectorAll<HTMLElement>("[data-global]");
    const topLimit = 72;
    let top: ReaderAyah | null = null;
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (rect.bottom <= topLimit || rect.top >= window.innerHeight) continue;
      const global = Number(node.dataset.global);
      if (!seen.current.has(global) && global >= 1 && global <= TOTAL_AYAHS) {
        seen.current.add(global);
        pendingRead.current.add(global);
      }
      if (!top) top = list.find((ayah) => ayah.number === global) ?? null;
    }
    if (top && top.number !== topRef.current?.number) {
      topRef.current = top;
      scheduleSave();
    }
  }, [scheduleSave]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const initial = requestAnimationFrame(scan);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(initial);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [scan, ayahs]);

  useEffect(() => {
    const persist = () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      flush(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", persist);
      persist();
    };
  }, [flush]);

  /* ── Audio ─────────────────────────────────────────────────────────── */
  const playIndex = useCallback((index: number, scroll = true) => {
    const audio = audioRef.current;
    const ayah = ayahsRef.current[index];
    if (!audio || !ayah) return;
    audio.src = ayah.audio;
    setCurrent(index);
    setAudioLoading(true);
    pendingRead.current.add(ayah.number);
    if (scroll) {
      document.querySelector(`[data-global="${ayah.number}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    audio.play().catch(() => {
      setIsPlaying(false);
      setAudioLoading(false);
    });
  }, []);

  function togglePlayAll() {
    const audio = audioRef.current;
    if (!audio || ayahs.length === 0) return;
    if (isPlaying) {
      audio.pause();
      return;
    }
    continuousRef.current = true;
    if (current !== null && audio.getAttribute("src")) {
      void audio.play();
      return;
    }
    const startIndex = topRef.current ? Math.max(0, ayahs.findIndex((ayah) => ayah.number === topRef.current?.number)) : 0;
    playIndex(startIndex);
  }

  function playAyah(ayah: ReaderAyah) {
    const index = ayahs.findIndex((item) => item.number === ayah.number);
    const audio = audioRef.current;
    if (index === current && audio && isPlaying) {
      audio.pause();
      return;
    }
    continuousRef.current = true;
    playIndex(index, false);
  }

  function stopAudio() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setCurrent(null);
    setIsPlaying(false);
  }

  function handleEnded() {
    if (continuousRef.current && current !== null && current + 1 < ayahs.length) playIndex(current + 1);
    else {
      setIsPlaying(false);
      setCurrent(null);
    }
  }

  /* ── Ayah actions ──────────────────────────────────────────────────── */
  function citation(ayah: ReaderAyah) {
    return `${shortBanglaName(SURAH_LIST[ayah.surahNumber - 1])} ${bnNum(ayah.surahNumber)}:${bnNum(ayah.numberInSurah)}`;
  }

  async function copyAyah(ayah: ReaderAyah) {
    const text = `${ayah.arabic}\n\n${ayah.bangla}\n\n— ${citation(ayah)}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("আয়াত কপি হয়েছে");
    } catch {
      toast.error("কপি করা যায়নি");
    }
  }

  async function shareAyah(ayah: ReaderAyah) {
    const text = `${ayah.arabic}\n\n${ayah.bangla}\n\n— ${citation(ayah)}`;
    const url = `${window.location.origin}/quran?surah=${ayah.surahNumber}&ayah=${ayah.numberInSurah}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: citation(ayah), text, url });
        return;
      } catch {
        return;
      }
    }
    await copyAyah(ayah);
  }

  function bookmark(ayah: ReaderAyah) {
    const added = toggleBookmark(ayah.surahNumber, ayah.numberInSurah);
    toast.success(added ? "বুকমার্ক করা হয়েছে" : "বুকমার্ক সরানো হয়েছে");
  }

  function markHere(ayah: ReaderAyah) {
    topRef.current = ayah;
    pendingRead.current.add(ayah.number);
    flush();
    toast.success(`${citation(ayah)} — এখানে থামা হিসেবে সংরক্ষিত`);
  }

  const bookmarkSet = useMemo(() => new Set(bookmarks.map((item) => `${item.surah}:${item.ayah}`)), [bookmarks]);
  const isBookmarked = (ayah: ReaderAyah) => bookmarkSet.has(`${ayah.surahNumber}:${ayah.numberInSurah}`);

  /* ── Keyboard: ← / → previous / next ──────────────────────────────── */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.metaKey || event.ctrlKey || event.altKey || target?.closest("input, textarea, select, [role=dialog]")) return;
      if (event.key === "ArrowLeft" && id > 1) router.push(`/quran?${mode}=${id - 1}`);
      if (event.key === "ArrowRight" && id < MAX_ID[mode]) router.push(`/quran?${mode}=${id + 1}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, mode, router]);

  /* ── Derived layout ────────────────────────────────────────────────── */
  const groups = useMemo(() => {
    const result: { surah: number; continuedFrom?: number; ayahs: { ayah: ReaderAyah; index: number }[] }[] = [];
    ayahs.forEach((ayah, index) => {
      const last = result[result.length - 1];
      if (!last || last.surah !== ayah.surahNumber) {
        result.push({ surah: ayah.surahNumber, continuedFrom: ayah.numberInSurah > 1 ? ayah.numberInSurah : undefined, ayahs: [] });
      }
      result[result.length - 1].ayahs.push({ ayah, index });
    });
    return result;
  }, [ayahs]);

  const surahMeta = mode === "surah" ? SURAH_LIST[id - 1] : null;
  const title = surahMeta ? shortBanglaName(surahMeta) : `পারা ${bnNum(id)}`;
  const subtitle = surahMeta
    ? `${surahMeta.banglaMeaning} • ${bnNum(surahMeta.numberOfAyahs)} আয়াত`
    : groups.length
      ? `${shortBanglaName(SURAH_LIST[groups[0].surah - 1])} – ${shortBanglaName(SURAH_LIST[groups[groups.length - 1].surah - 1])}`
      : "লোড হচ্ছে…";
  const arabicSize = ARABIC_STEPS[Math.min(ARABIC_STEPS.length - 1, Math.max(0, prefs.arabicStep))];
  const banglaSize = BANGLA_STEPS[Math.min(BANGLA_STEPS.length - 1, Math.max(0, prefs.banglaStep))];
  const playingAyah = current !== null ? ayahs[current] : null;
  const view = prefs.view;

  const prevHref = id > 1 ? `/quran?${mode}=${id - 1}` : null;
  const nextHref = id < MAX_ID[mode] ? `/quran?${mode}=${id + 1}` : null;
  const prevLabel = mode === "surah" ? (id > 1 ? shortBanglaName(SURAH_LIST[id - 2]) : "") : `পারা ${bnNum(id - 1)}`;
  const nextLabel = mode === "surah" ? (id < 114 ? shortBanglaName(SURAH_LIST[id]) : "") : `পারা ${bnNum(id + 1)}`;

  return (
    <div style={prefs.theme === "sepia" ? SEPIA : undefined} className="min-h-dvh bg-background text-foreground">
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => setAudioLoading(false)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onError={() => {
          if (audioRef.current?.getAttribute("src")) {
            setIsPlaying(false);
            setAudioLoading(false);
            toast.error("অডিও চালানো যায়নি — ইন্টারনেট সংযোগ দেখুন।");
          }
        }}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-hairline bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-1 px-2 sm:px-4">
          <Link href="/quran" aria-label="সূরার তালিকা" className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <button type="button" onClick={() => setJumpOpen(true)} className="min-w-0 flex-1 rounded-xl px-1 py-1 text-left transition hover:bg-surface-sunken">
            <span className="block truncate text-base font-bold leading-tight">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
          </button>
          <button
            type="button"
            onClick={togglePlayAll}
            disabled={loading}
            aria-label={isPlaying ? "তিলাওয়াত থামান" : "তিলাওয়াত শুনুন"}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-on-primary shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {audioLoading && isPlaying ? <Loader2 className="size-5 animate-spin" /> : isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
          </button>
          <button type="button" onClick={() => setJumpOpen(true)} aria-label="আয়াতে যান" className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground">
            <Hash className="size-5" />
          </button>
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label="পড়ার সেটিংস" className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground">
            <Settings2 className="size-5" />
          </button>
        </div>
        <div className="h-0.5 bg-transparent">
          <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${scrollPercent}%` }} />
        </div>
      </header>

      <main className={cn("mx-auto max-w-3xl px-3 pt-4 sm:px-4 sm:pt-6", playingAyah ? "pb-40" : "pb-24")}>
        {loading ? <ReaderSkeleton /> : null}

        {failed ? (
          <div className="mt-10 rounded-card border border-hairline bg-surface p-6 text-center shadow-card">
            <AlertCircle className="mx-auto size-8 text-warning" />
            <p className="mt-3 font-semibold">আয়াত লোড করা যায়নি</p>
            <p className="mt-1 text-sm text-muted-foreground">ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন। সেভ করা সূরা অফলাইনেও পড়া যায়।</p>
            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary"
            >
              <RefreshCw className="size-4" /> আবার চেষ্টা করুন
            </button>
          </div>
        ) : null}

        <div className="space-y-6">
          {groups.map((group) => {
            const surah = SURAH_LIST[group.surah - 1];
            return (
              <div key={`${group.surah}-${group.continuedFrom ?? 1}`} className="space-y-3">
                <SurahHeader surah={surah} continuedFrom={group.continuedFrom} />

                {view === "mushaf" ? (
                  <div className="rounded-card border border-hairline bg-surface px-4 py-5 shadow-card sm:px-7 sm:py-7">
                    <p dir="rtl" lang="ar" className="quran-text text-justify" style={{ fontSize: arabicSize, lineHeight: 2.3 }}>
                      {group.ayahs.map(({ ayah, index }) => (
                        <span
                          key={ayah.number}
                          id={`a-${ayah.surahNumber}-${ayah.numberInSurah}`}
                          data-global={ayah.number}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActionAyah(ayah)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") setActionAyah(ayah);
                          }}
                          className={cn(
                            "scroll-mt-24 cursor-pointer rounded-md transition-colors hover:bg-primary-soft/70",
                            current === index && "bg-primary-soft",
                          )}
                        >
                          {ayah.arabic}
                          <span className="ayah-marker" aria-label={`আয়াত ${ayah.numberInSurah}`}>
                            {toArabicDigits(ayah.numberInSurah)}
                          </span>{" "}
                        </span>
                      ))}
                    </p>
                  </div>
                ) : view === "bangla" ? (
                  <div className="divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-card">
                    {group.ayahs.map(({ ayah, index }) => (
                      <button
                        type="button"
                        key={ayah.number}
                        id={`a-${ayah.surahNumber}-${ayah.numberInSurah}`}
                        data-global={ayah.number}
                        onClick={() => setActionAyah(ayah)}
                        className={cn("flex w-full scroll-mt-24 gap-3 px-4 py-4 text-left transition hover:bg-surface-sunken", current === index && "bg-primary-soft")}
                      >
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                          {bnNum(ayah.numberInSurah)}
                        </span>
                        <span className="font-bangla-serif leading-[1.9] text-foreground" style={{ fontSize: banglaSize }}>
                          {ayah.bangla}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  group.ayahs.map(({ ayah, index }) => (
                    <AyahCard
                      key={ayah.number}
                      ayah={ayah}
                      active={current === index}
                      playing={current === index && isPlaying}
                      showTranslation={view === "both"}
                      arabicSize={arabicSize}
                      banglaSize={banglaSize}
                      bookmarked={isBookmarked(ayah)}
                      onPlay={() => playAyah(ayah)}
                      onBookmark={() => bookmark(ayah)}
                      onMore={() => setActionAyah(ayah)}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* ── Previous / next ── */}
        {!loading && !failed ? (
          <nav aria-label="আগের ও পরের" className="mt-8 grid grid-cols-2 gap-3">
            {prevHref ? (
              <Link href={prevHref} className="flex items-center gap-2 rounded-card border border-hairline bg-surface p-4 shadow-card transition hover:border-hairline-strong active:scale-[0.98]">
                <ChevronLeft className="size-5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">আগের {mode === "surah" ? "সূরা" : "পারা"}</span>
                  <span className="block truncate font-semibold">{prevLabel}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {nextHref ? (
              <Link href={nextHref} className="flex items-center justify-end gap-2 rounded-card border border-hairline bg-surface p-4 text-right shadow-card transition hover:border-hairline-strong active:scale-[0.98]">
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">পরের {mode === "surah" ? "সূরা" : "পারা"}</span>
                  <span className="block truncate font-semibold">{nextLabel}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-primary" />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </main>

      {/* ── Mini player ── */}
      {playingAyah ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-hairline bg-surface-raised/95 p-2 pl-4 shadow-2xl backdrop-blur-xl">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{citation(playingAyah)}</p>
              <p className="truncate text-xs text-muted-foreground">{RECITERS.find((item) => item.id === reciter)?.name}</p>
            </div>
            <button type="button" aria-label="আগের আয়াত" disabled={current === 0} onClick={() => current !== null && playIndex(current - 1)} className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-surface-sunken disabled:opacity-40">
              <SkipBack className="size-5" />
            </button>
            <button
              type="button"
              aria-label={isPlaying ? "বিরতি" : "চালু"}
              onClick={() => (isPlaying ? audioRef.current?.pause() : void audioRef.current?.play())}
              className="grid size-12 place-items-center rounded-full bg-primary text-on-primary shadow-sm active:scale-95"
            >
              {audioLoading && isPlaying ? <Loader2 className="size-5 animate-spin" /> : isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
            </button>
            <button type="button" aria-label="পরের আয়াত" disabled={current === null || current >= ayahs.length - 1} onClick={() => current !== null && playIndex(current + 1)} className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-surface-sunken disabled:opacity-40">
              <SkipForward className="size-5" />
            </button>
            <button type="button" aria-label="বন্ধ করুন" onClick={stopAudio} className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-surface-sunken">
              <X className="size-5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── Sheets ── */}
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} prefs={prefs} onChange={setPrefs} />

      <JumpSheet
        open={jumpOpen}
        onClose={() => setJumpOpen(false)}
        mode={mode}
        id={id}
        groups={groups.map((group) => ({ surah: group.surah, first: group.ayahs[0]?.ayah.numberInSurah ?? 1, last: group.ayahs[group.ayahs.length - 1]?.ayah.numberInSurah ?? 1 }))}
      />

      <Sheet open={actionAyah !== null} onClose={() => setActionAyah(null)} title={actionAyah ? `আয়াত ${citation(actionAyah)}` : ""}>
        {actionAyah ? (
          <div>
            <p dir="rtl" lang="ar" className="quran-text line-clamp-3 text-2xl">{actionAyah.arabic}</p>
            <p className="mt-2 line-clamp-4 font-bangla-serif text-sm leading-7 text-muted-foreground">{actionAyah.bangla}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <ActionButton icon={current !== null && ayahs[current]?.number === actionAyah.number && isPlaying ? Pause : Play} label="তিলাওয়াত শুনুন" onClick={() => { playAyah(actionAyah); setActionAyah(null); }} />
              <ActionButton icon={isBookmarked(actionAyah) ? BookmarkCheck : Bookmark} label={isBookmarked(actionAyah) ? "বুকমার্ক সরান" : "বুকমার্ক"} onClick={() => bookmark(actionAyah)} />
              <ActionButton icon={Copy} label="কপি করুন" onClick={() => { void copyAyah(actionAyah); setActionAyah(null); }} />
              <ActionButton icon={Share2} label="শেয়ার করুন" onClick={() => { void shareAyah(actionAyah); setActionAyah(null); }} />
              <ActionButton icon={MapPin} label="এখানে থামলাম" onClick={() => { markHere(actionAyah); setActionAyah(null); }} className="col-span-2" />
            </div>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, className }: { icon: typeof Play; label: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("flex h-12 items-center justify-center gap-2 rounded-xl border border-hairline bg-surface-sunken text-sm font-semibold transition hover:border-hairline-strong active:scale-[0.98]", className)}>
      <Icon className="size-[18px] text-primary" /> {label}
    </button>
  );
}

function AyahCard({
  ayah,
  active,
  playing,
  showTranslation,
  arabicSize,
  banglaSize,
  bookmarked,
  onPlay,
  onBookmark,
  onMore,
}: {
  ayah: ReaderAyah;
  active: boolean;
  playing: boolean;
  showTranslation: boolean;
  arabicSize: number;
  banglaSize: number;
  bookmarked: boolean;
  onPlay: () => void;
  onBookmark: () => void;
  onMore: () => void;
}) {
  return (
    <article
      id={`a-${ayah.surahNumber}-${ayah.numberInSurah}`}
      data-global={ayah.number}
      className={cn(
        "scroll-mt-24 rounded-card border bg-surface px-4 pb-4 pt-3 shadow-card transition-colors sm:px-6 sm:pb-5",
        active ? "border-primary/60 ring-2 ring-primary/15" : "border-hairline",
      )}
    >
      <div className="flex items-center gap-1">
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-soft-foreground">
          {bnNum(ayah.surahNumber)}:{bnNum(ayah.numberInSurah)}
        </span>
        <span className="flex-1" />
        <button type="button" onClick={onPlay} aria-label={playing ? "বিরতি" : "এই আয়াত শুনুন"} className={cn("grid size-10 place-items-center rounded-full transition", playing ? "bg-primary text-on-primary" : "text-muted-foreground hover:bg-surface-sunken hover:text-primary")}>
          {playing ? <Pause className="size-[18px] fill-current" /> : <Play className="ml-0.5 size-[18px]" />}
        </button>
        <button type="button" onClick={onBookmark} aria-label={bookmarked ? "বুকমার্ক সরান" : "বুকমার্ক করুন"} className={cn("grid size-10 place-items-center rounded-full transition hover:bg-surface-sunken", bookmarked ? "text-gold" : "text-muted-foreground hover:text-gold")}>
          <Bookmark className={cn("size-[18px]", bookmarked && "fill-current")} />
        </button>
        <button type="button" onClick={onMore} aria-label="আরও অপশন" className="grid size-10 place-items-center rounded-full text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground">
          <Share2 className="size-[18px]" />
        </button>
      </div>
      <p dir="rtl" lang="ar" className="quran-text mt-2 text-right" style={{ fontSize: arabicSize }}>
        {ayah.arabic}
        <span className="ayah-marker">{toArabicDigits(ayah.numberInSurah)}</span>
      </p>
      {showTranslation && ayah.bangla ? (
        <p className="mt-3 border-t border-hairline pt-3 font-bangla-serif leading-[1.95] text-foreground/90" style={{ fontSize: banglaSize }}>
          {ayah.bangla}
        </p>
      ) : null}
    </article>
  );
}

function JumpSheet({
  open,
  onClose,
  mode,
  id,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  id: number;
  groups: { surah: number; first: number; last: number }[];
}) {
  const [value, setValue] = useState("");
  const [target, setTarget] = useState(groups[0]?.surah ?? id);
  const group = groups.find((item) => item.surah === target) ?? groups[0];

  function go() {
    if (!group) return;
    const number = Number(value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit))));
    if (!Number.isInteger(number) || number < group.first || number > group.last) {
      toast.error(`${bnNum(group.first)} থেকে ${bnNum(group.last)} এর মধ্যে নম্বর দিন`);
      return;
    }
    onClose();
    setValue("");
    requestAnimationFrame(() => document.getElementById(`a-${group.surah}-${number}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <Sheet open={open} onClose={onClose} title="আয়াতে যান">
      {mode === "juz" && groups.length > 1 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {groups.map((item) => (
            <button
              key={item.surah}
              type="button"
              onClick={() => setTarget(item.surah)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold",
                item.surah === group?.surah ? "border-primary bg-primary-soft text-primary-soft-foreground" : "border-hairline text-muted-foreground",
              )}
            >
              {shortBanglaName(SURAH_LIST[item.surah - 1])}
            </button>
          ))}
        </div>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          go();
        }}
        className="flex gap-2"
      >
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="numeric"
          autoFocus
          placeholder={group ? `আয়াত নম্বর (${bnNum(group.first)}–${bnNum(group.last)})` : "আয়াত নম্বর"}
          className="h-12 min-w-0 flex-1 rounded-xl border border-hairline-strong bg-surface px-4 text-base focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        />
        <button type="submit" className="h-12 rounded-xl bg-primary px-5 font-semibold text-on-primary">
          যান
        </button>
      </form>
      <Link href="/quran" onClick={onClose} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-xl border border-hairline text-sm font-semibold text-muted-foreground hover:text-foreground">
        অন্য সূরা / পারা বেছে নিন
      </Link>
    </Sheet>
  );
}

function ReaderSkeleton() {
  return (
    <div aria-busy="true" aria-label="লোড হচ্ছে" className="space-y-3">
      <div className="hero-surface h-56 animate-pulse rounded-card opacity-80" />
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="rounded-card border border-hairline bg-surface p-5 shadow-card">
          <div className="h-6 w-16 animate-pulse rounded-full bg-surface-sunken" />
          <div className="mt-4 ml-auto h-7 w-11/12 animate-pulse rounded-lg bg-surface-sunken" />
          <div className="mt-3 ml-auto h-7 w-3/4 animate-pulse rounded-lg bg-surface-sunken" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-surface-sunken" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}
