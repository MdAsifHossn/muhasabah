"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AudioSheet } from "@/components/quran/audio-sheet";
import { AyahCard } from "@/components/quran/ayah-card";
import { BanglaFlowView } from "@/components/quran/bangla-flow-view";
import { DesktopHeader } from "@/components/quran/desktop-header";
import { MushafView } from "@/components/quran/mushaf-view";
import { ReaderHeader } from "@/components/quran/reader-header";
import { ReaderProgressStrip, ResumeBanner, type ResumeTarget } from "@/components/quran/reader-progress";
import { ReaderSidebar } from "@/components/quran/reader-sidebar";
import { ReaderToolbar } from "@/components/quran/reader-toolbar";
import { SettingsSheet } from "@/components/quran/settings-sheet";
import { SurahPicker } from "@/components/quran/surah-picker";
import type { FontSize, Mode, QuranPayload, ReaderAyah, ViewMode } from "@/components/quran/types";
import { RECITERS } from "@/components/quran/types";
import { SURAH_LIST } from "@/lib/quran";
import {
  isFontSize,
  isReciter,
  isViewMode,
  sanitizeReadAyahs,
  toIntInRange,
  TOTAL_AYAHS,
  type QuranProgressRecord,
} from "@/lib/quran-progress";
import { cn } from "@/lib/utils";

const MAX_ID: Record<Mode, number> = { surah: 114, juz: 30 };
const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const SAVE_DEBOUNCE_MS = 1600;

function SurahDivider({ ayah }: { ayah: ReaderAyah }) {
  const showBismillah = ayah.surahNumber !== 1 && ayah.surahNumber !== 9;
  return (
    <div className="my-5 rounded-2xl bg-emerald-900 px-5 py-4 text-center text-white">
      <p className="text-lg font-black">{ayah.surahName}</p>
      <p className="mt-0.5 text-xs text-emerald-200">সূরা {ayah.surahNumber.toLocaleString("bn-BD")}</p>
      {showBismillah ? (
        <p dir="rtl" className="mt-3 text-right font-serif text-xl text-emerald-50">
          {BISMILLAH}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Full-screen Quran reader — the ONE implementation behind BOTH `/quran`
 * (public, no login) and the old `/dashboard/quran` URL (which now redirects).
 *
 * `isLoggedIn` is decided server-side by the route and only switches the
 * OPTIONAL progress features on:
 *   - member: resume banner, saved preferences, read-% chip, debounced saves.
 *   - guest : `/api/quran/progress` is NEVER fetched (it answers 401), no chip,
 *             no resume — everything else is identical.
 */
export function QuranReader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("surah");
  const [selected, setSelected] = useState(1);
  const [reciter, setReciter] = useState("ar.alafasy");
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [fontSize, setFontSize] = useState<FontSize>("medium");
  const [ayahs, setAyahs] = useState<ReaderAyah[]>([]);
  const [reload, setReload] = useState(0);
  // Outcome of the most recent surah/juz fetch, keyed by its request. Loading
  // and error are DERIVED from it instead of being set imperatively, which
  // keeps the fetch effect free of synchronous setState calls.
  const [result, setResult] = useState<{ key: string; failed: boolean }>({ key: "", failed: false });
  const requestKey = `${mode}/${selected}/${reciter}/${reload}`;
  const loading = result.key !== requestKey;
  const error = result.failed && result.key === requestKey;
  const [playing, setPlaying] = useState<number | null>(null);
  const [continuous, setContinuous] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [resume, setResume] = useState<ResumeTarget | null>(null);
  const [readCount, setReadCount] = useState(0);
  // Bumped after hydration so the resume-scroll effect can re-run even when the
  // saved surah/juz happens to equal the one already on screen.
  const [scrollTick, setScrollTick] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const ayahNodes = useRef(new Map<number, HTMLElement>());
  const ayahsRef = useRef<ReaderAyah[]>([]);
  ayahsRef.current = ayahs;

  // ---- database-backed reading progress ---------------------------------
  const latest = useRef({ mode, selected, viewMode, fontSize, reciter });
  latest.current = { mode, selected, viewMode, fontSize, reciter };
  /** Topmost visible ayah = the resume anchor being tracked. */
  const topRef = useRef<{ global: number; ayahInSurah: number; surah: number } | null>(null);
  const readSet = useRef(new Set<number>());
  const pendingRead = useRef(new Set<number>());
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sending = useRef(false);
  const queued = useRef(false);
  const pendingScroll = useRef<{ global: number; surah: number; ayahInSurah: number } | null>(null);
  /** True once the user explicitly picked a surah/juz this visit (beats resume). */
  const userChose = useRef(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetch(`/api/quran/${mode}/${selected}?reciter=${encodeURIComponent(reciter)}&v=4`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Request failed");
        return response.json() as Promise<QuranPayload>;
      })
      .then((data) => {
        if (!active) return;
        if (!Array.isArray(data.ayahs)) throw new Error("Malformed payload");
        setAyahs(
          data.ayahs.map((ayah) => ({
            ...ayah,
            surahName: SURAH_LIST[ayah.surahNumber - 1]?.banglaName ?? ayah.surahName,
          })),
        );
        setResult({ key: requestKey, failed: false });
      })
      .catch(() => {
        if (active) setResult({ key: requestKey, failed: true });
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [mode, selected, reciter, reload, requestKey]);

  function findAyahNode(globalNumber: number): HTMLElement | null {
    return (
      ayahNodes.current.get(globalNumber) ??
      (scrollRef.current?.querySelector(`[data-ayah="${globalNumber}"]`) as HTMLElement | null) ??
      null
    );
  }

  function markRead(globalNumber: number) {
    if (globalNumber < 1 || globalNumber > TOTAL_AYAHS || readSet.current.has(globalNumber)) return;
    readSet.current.add(globalNumber);
    pendingRead.current.add(globalNumber);
    setReadCount(readSet.current.size);
  }

  function trackPosition(ayah: ReaderAyah) {
    const previous = topRef.current;
    if (previous && previous.global === ayah.number) return;
    topRef.current = { global: ayah.number, ayahInSurah: ayah.numberInSurah, surah: ayah.surahNumber };
    scheduleSave();
  }

  /**
   * Marks every ayah currently intersecting the reading viewport as read and
   * records the topmost one as the resume position (drives the debounced save).
   */
  function scanVisible() {
    const container = scrollRef.current;
    if (!container || ayahsRef.current.length === 0) return;
    const bounds = container.getBoundingClientRect();
    const nodes = container.querySelectorAll<HTMLElement>("[data-ayah]");
    let topAyah: ReaderAyah | null = null;
    for (const node of nodes) {
      const globalNumber = Number(node.dataset.ayah);
      if (!Number.isInteger(globalNumber)) continue;
      const rect = node.getBoundingClientRect();
      if (rect.bottom <= bounds.top || rect.top >= bounds.bottom) continue;
      markRead(globalNumber);
      if (!topAyah) topAyah = ayahsRef.current.find((ayah) => ayah.number === globalNumber) ?? null;
    }
    if (topAyah) trackPosition(topAyah);
  }

  function buildPayload() {
    const current = latest.current;
    const top = topRef.current;
    return {
      mode: current.mode,
      // In juz mode the surah follows the topmost ayah; surah mode keeps the open one.
      surah: current.mode === "surah" ? current.selected : (top?.surah ?? 1),
      juz: current.mode === "juz" ? current.selected : null,
      ayahInSurah: top?.ayahInSurah ?? 1,
      globalAyah: top?.global ?? 1,
      viewMode: current.viewMode,
      fontSize: current.fontSize,
      reciter: current.reciter,
      newRead: Array.from(pendingRead.current),
    };
  }

  /** Raw POST; on 2xx the flushed newRead numbers leave the pending delta. */
  async function postProgress(keepalive: boolean) {
    // Guests have no server-side progress record — never call the API.
    if (!isLoggedIn) return false;
    const payload = buildPayload();
    const sent = payload.newRead;
    try {
      const response = await fetch("/api/quran/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
        keepalive,
      });
      if (response.ok) for (const number of sent) pendingRead.current.delete(number);
      return response.ok;
    } catch {
      return false;
    }
  }

  async function flushSave(keepalive = false) {
    if (!isLoggedIn) return;
    if (!hydrated.current || !topRef.current) return;
    if (sending.current) {
      if (!keepalive) queued.current = true;
      return;
    }
    sending.current = true;
    try {
      await postProgress(keepalive);
    } finally {
      sending.current = false;
      if (queued.current) {
        queued.current = false;
        void flushSave(false);
      }
    }
  }

  function scheduleSave(immediate = false) {
    if (!isLoggedIn) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (!hydrated.current) return;
    if (immediate) {
      void flushSave(false);
      return;
    }
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void flushSave(false);
    }, SAVE_DEBOUNCE_MS);
  }

  // One-time hydration: restore preferences, read coverage and resume position.
  // Skipped entirely for guests — `/api/quran/progress` requires a session and
  // must never be requested without one (it answers 401).
  useEffect(() => {
    let active = true;
    (async () => {
      let record: QuranProgressRecord | null = null;
      if (isLoggedIn) {
        try {
          const response = await fetch("/api/quran/progress", { cache: "no-store" });
          if (response.ok) record = (await response.json()) as QuranProgressRecord | null;
        } catch {
          record = null;
        }
      }
      if (!active) return;

      // An explicit ?mode/?surah/?juz for THIS visit means "do not resume".
      const params = new URLSearchParams(window.location.search);
      const paramMode = params.get("mode");
      const paramSurah = toIntInRange(params.get("surah"), 1, MAX_ID.surah);
      const paramJuz = toIntInRange(params.get("juz"), 1, MAX_ID.juz);
      const explicit =
        paramMode === "surah" || paramMode === "juz" || paramSurah !== null || paramJuz !== null;

      if (record) {
        if (isViewMode(record.viewMode)) setViewMode(record.viewMode);
        if (isFontSize(record.fontSize)) setFontSize(record.fontSize);
        if (isReciter(record.reciter)) setReciter(record.reciter);
        readSet.current = new Set(sanitizeReadAyahs(record.readAyahs));
        setReadCount(readSet.current.size);

        if (!explicit && !userChose.current) {
          const savedMode: Mode = record.mode === "juz" ? "juz" : "surah";
          pendingScroll.current = {
            global: record.globalAyah,
            surah: record.surah,
            ayahInSurah: record.ayahInSurah,
          };
          setMode(savedMode);
          setSelected(savedMode === "juz" ? (record.juz ?? 1) : record.surah);
          setResume({
            mode: savedMode,
            surah: record.surah,
            juz: record.juz,
            ayahInSurah: record.ayahInSurah,
          });
          setScrollTick((tick) => tick + 1);
        }
      }

      if (explicit) {
        let nextMode: Mode = "surah";
        if (paramMode === "juz") nextMode = "juz";
        else if (paramMode !== "surah" && paramJuz !== null) nextMode = "juz";
        setMode(nextMode);
        setSelected(nextMode === "juz" ? (paramJuz ?? 1) : (paramSurah ?? 1));
      }
      hydrated.current = true;
    })();
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  // After the opened surah/juz loads: jump to the saved ayah, then scan.
  useEffect(() => {
    if (loading || ayahs.length === 0) return;
    const target = pendingScroll.current;
    if (target) {
      pendingScroll.current = null;
      const fallback = ayahs.find(
        (ayah) => ayah.surahNumber === target.surah && ayah.numberInSurah === target.ayahInSurah,
      );
      const node = findAyahNode(target.global) ?? (fallback ? findAyahNode(fallback.number) : null);
      node?.scrollIntoView({ behavior: "auto", block: "center" });
    }
    scanVisible();
    const frame = requestAnimationFrame(() => scanVisible());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, ayahs, scrollTick]);

  // Light scroll listener: marks read coverage + tracks the topmost visible ayah.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let frame = 0;
    const handleScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scanVisible();
      });
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on tab-hide / page-hide (and on unmount) with keepalive so the
  // last reading position survives navigation or the tab being closed.
  useEffect(() => {
    const persist = () => {
      if (!isLoggedIn || !hydrated.current || !topRef.current) return;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      if (sending.current) void postProgress(true);
      else void flushSave(true);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", persist);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", persist);
      persist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Desktop keyboard shortcuts: ←/→ jump to the previous/next surah-or-juz,
  // `s` toggles the settings panel (or closes an open sheet). Esc is handled
  // by Sheet itself. Ignored while typing in a field.
  useEffect(() => {
    const isFormField = (element: EventTarget | null) => {
      const node = element as HTMLElement | null;
      if (!node || typeof node !== "object" || !("tagName" in node)) return false;
      const tag = node.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable === true;
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isFormField(event.target)) return;
      // A sheet/dialog is open: only close keys act, never unit navigation.
      const sheetOpen = pickerOpen || settingsOpen || audioOpen;
      if (event.key === "s" || event.key === "S") {
        event.preventDefault();
        if (audioOpen) setAudioOpen(false);
        else if (pickerOpen) setPickerOpen(false);
        else if (settingsOpen) setSettingsOpen(false);
        else setSettingsOpen(true);
        return;
      }
      if (sheetOpen) return;
      if (event.key === "ArrowLeft" && selected > 1) {
        event.preventDefault();
        choose(mode, selected - 1);
      } else if (event.key === "ArrowRight" && selected < MAX_ID[mode]) {
        event.preventDefault();
        choose(mode, selected + 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selected, pickerOpen, settingsOpen, audioOpen]);

  function stopPlayback() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPlaying(null);
    setContinuous(false);
  }

  /** Plays exactly one ayah using that ayah's own `audio` URL. */
  function playAyah(ayah: ReaderAyah, element?: HTMLElement | null) {
    const audio = audioRef.current;
    if (!audio || !ayah) return;
    audio.src = ayah.audio;
    setPlaying(ayah.number);
    // Playing counts as reading that ayah → save right away, not debounced.
    markRead(ayah.number);
    scheduleSave(true);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    const started = audio.play();
    if (started) {
      started.catch(() => {
        setPlaying(null);
        setContinuous(false);
      });
    }
  }

  function toggleAyah(ayah: ReaderAyah, element?: HTMLElement | null) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing === ayah.number) {
      audio.pause();
      setPlaying(null);
      setContinuous(false);
      scheduleSave(true);
      return;
    }
    setContinuous(true);
    playAyah(ayah, element);
  }

  function toggleSurahPlayback() {
    const audio = audioRef.current;
    if (!audio || ayahs.length === 0) return;
    if (playing !== null) {
      audio.pause();
      setPlaying(null);
      setContinuous(false);
      scheduleSave(true);
      return;
    }
    setContinuous(true);
    playAyah(ayahs[0], findAyahNode(ayahs[0].number));
  }

  function handleEnded() {
    if (continuous && playing !== null) {
      const index = ayahs.findIndex((ayah) => ayah.number === playing);
      const next = ayahs[index + 1];
      if (next) {
        playAyah(next, findAyahNode(next.number));
        return;
      }
    }
    setPlaying(null);
    setContinuous(false);
  }

  function choose(nextMode: Mode, id: number) {
    stopPlayback();
    userChose.current = true;
    // A fresh surah/juz invalidates the tracked position until it reloads.
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    topRef.current = null;
    pendingScroll.current = null;
    setResume(null);
    setMode(nextMode);
    setSelected(id);
    // `requestKey` changes with mode/selected, so loading + a cleared error
    // state follow automatically; just drop the stale ayahs.
    setAyahs([]);
    setPickerOpen(false);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  function startOver() {
    setResume(null);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  function changeReciter(id: string) {
    setAudioOpen(false);
    if (id === reciter) return;
    stopPlayback();
    setReciter(id);
    scheduleSave();
  }

  const surahMeta = SURAH_LIST[selected - 1];
  const title =
    mode === "surah" ? (surahMeta?.banglaName ?? "আল-কুরআন") : `পারা ${selected.toLocaleString("bn-BD")}`;
  const meta =
    mode === "surah"
      ? `${surahMeta?.englishName ?? "সূরা"} • ${surahMeta?.numberOfAyahs.toLocaleString("bn-BD") ?? ""} আয়াত`
      : "পবিত্র কুরআন • ৩০ পারা";
  /** Desktop header line — shows the ayah range of the open unit. */
  const desktopMeta =
    mode === "surah"
      ? `${surahMeta?.englishName ?? "সূরা"} • আয়াত ১–${(surahMeta?.numberOfAyahs ?? 1).toLocaleString("bn-BD")}`
      : `পারা ${selected.toLocaleString("bn-BD")} • ${ayahs.length.toLocaleString("bn-BD")} আয়াত`;
  const reciterLabel =
    RECITERS.find((item) => item.id === reciter)?.name.split(" ").slice(-1)[0] ?? "ক্বারী";
  const busy = ayahs.length === 0;

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Desktop-only persistent navigation rail — hidden below lg. */}
      <ReaderSidebar
        mode={mode}
        selected={selected}
        onModeChange={(nextMode) => choose(nextMode, 1)}
        onSelect={(nextMode, id) => choose(nextMode, id)}
        onBack={() => router.push(isLoggedIn ? "/dashboard" : "/")}
      />

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Per-ayah audio element — no timeline UI, no progress bar. */}
        <audio
          ref={audioRef}
          onEnded={handleEnded}
          onError={() => {
            const audio = audioRef.current;
            if (audio && audio.getAttribute("src")) {
              setPlaying(null);
              setContinuous(false);
            }
          }}
        />

        {/* Mobile / tablet chrome — byte-identical app bar, hidden on lg+. */}
        <ReaderHeader
          title={title}
          meta={meta}
          playing={playing !== null}
          disabled={busy}
          onBack={() => router.push(isLoggedIn ? "/dashboard" : "/")}
          onTogglePlay={toggleSurahPlayback}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Desktop chrome — sticky two-row header, no fixed bottom bar. */}
        <div className="relative hidden lg:block">
          <DesktopHeader
            title={title}
            meta={desktopMeta}
            mode={mode}
            hasPrev={selected > 1}
            hasNext={selected < MAX_ID[mode]}
            playing={playing !== null}
            disabled={busy}
            viewMode={viewMode}
            fontSize={fontSize}
            reciterLabel={reciterLabel}
            readCount={isLoggedIn ? readCount : null}
            onBack={() => router.push(isLoggedIn ? "/dashboard" : "/")}
            onPrev={() => choose(mode, selected - 1)}
            onNext={() => choose(mode, selected + 1)}
            onTogglePlay={toggleSurahPlayback}
            onViewMode={(value) => {
              setViewMode(value);
              scheduleSave();
            }}
            onFontSize={(value) => {
              setFontSize(value);
              scheduleSave();
            }}
            onOpenAudio={() => setAudioOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
          {/* Resume banner floats below the header → zero layout shift when it
              appears or is dismissed. Members only — guests never save a position. */}
          {isLoggedIn && resume ? (
            <div className="pointer-events-none absolute inset-x-0 top-full z-40 mt-3 flex justify-center px-5">
              <ResumeBanner
                showDismiss
                resume={resume}
                onStartOver={startOver}
                onDismiss={() => setResume(null)}
                className="pointer-events-auto max-w-3xl shadow-lg"
              />
            </div>
          ) : null}
        </div>

        {/* Progress chip + resume banner live in the flex column: they can never
            cover the reading text or the bottom toolbar. (lg+ uses the header
            chip + floating banner above.) Hidden for guests — there is no saved
            progress to show and `/api/quran/progress` is never called. */}
        {isLoggedIn ? (
          <ReaderProgressStrip
            readCount={readCount}
            resume={resume}
            onStartOver={startOver}
            onDismiss={() => setResume(null)}
          />
        ) : null}

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-4 lg:px-8 lg:pb-14 lg:pt-6 lg:[scrollbar-color:#d6d3d1_transparent] lg:[scrollbar-width:thin] lg:[&::-webkit-scrollbar]:w-2.5 lg:[&::-webkit-scrollbar]:rounded-full lg:[&::-webkit-scrollbar-thumb]:rounded-full lg:[&::-webkit-scrollbar-thumb]:bg-stone-300 lg:[&::-webkit-scrollbar-thumb]:hover:bg-stone-400"
        >
          <div className={cn("mx-auto w-full", viewMode === "mushaf" ? "max-w-5xl" : "max-w-3xl")}>
          {/* Surah 1: the bismillah IS ayah 1, so no separate header — never shown twice.
              The "শুধু বাংলা" mode contains no Arabic at all. */}
          {mode === "surah" && selected !== 1 && selected !== 9 && viewMode !== "bangla" ? (
            <div
              dir="rtl"
              className="mb-4 rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-right font-serif text-2xl text-emerald-950 shadow-sm"
            >
              {BISMILLAH}
            </div>
          ) : null}

          {loading && ayahs.length === 0 ? (
            <div className="grid min-h-80 place-items-center">
              <div className="text-center text-emerald-800">
                <Loader2 className="mx-auto size-8 animate-spin" />
                <p className="mt-3 text-sm font-bold">আয়াত লোড হচ্ছে...</p>
              </div>
            </div>
          ) : error && ayahs.length === 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="font-bold text-red-800">কুরআনের তথ্য লোড করা যায়নি</p>
              <p className="mt-1 text-sm text-red-600">ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p>
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                className="mt-4 min-h-11 cursor-pointer rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white transition-colors active:bg-red-800 lg:hover:bg-red-800"
              >
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : viewMode === "mushaf" ? (
            <MushafView
              ayahs={ayahs}
              fontSize={fontSize}
              playing={playing}
              onPlay={(ayah, element) => toggleAyah(ayah, element)}
            />
          ) : viewMode === "bangla" ? (
            <BanglaFlowView
              ayahs={ayahs}
              fontSize={fontSize}
              playing={playing}
              onPlay={(ayah, element) => toggleAyah(ayah, element)}
            />
          ) : (
            <div className="space-y-3">
              {ayahs.map((ayah, index) => {
                const showSurah =
                  mode === "juz" && (index === 0 || ayahs[index - 1].surahNumber !== ayah.surahNumber);
                return (
                  <div
                    key={ayah.number}
                    data-ayah={ayah.number}
                    ref={(node) => {
                      if (node) ayahNodes.current.set(ayah.number, node);
                      else ayahNodes.current.delete(ayah.number);
                    }}
                  >
                    {showSurah ? <SurahDivider ayah={ayah} /> : null}
                    <AyahCard
                      ayah={ayah}
                      fontSize={fontSize}
                      showArabic
                      showBangla={viewMode !== "arabic"}
                      playing={playing === ayah.number}
                      onPlay={() => toggleAyah(ayah, ayahNodes.current.get(ayah.number))}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ReaderToolbar
        hasPrev={selected > 1}
        hasNext={selected < MAX_ID[mode]}
        playing={playing !== null}
        disabled={busy}
        reciterLabel={reciterLabel}
        onPrev={() => choose(mode, selected - 1)}
        onNext={() => choose(mode, selected + 1)}
        onOpenList={() => setPickerOpen(true)}
        onOpenAudio={() => setAudioOpen(true)}
        onTogglePlay={toggleSurahPlayback}
      />
      </div>

      <SurahPicker
        open={pickerOpen}
        mode={mode}
        selected={selected}
        onModeChange={(nextMode) => choose(nextMode, 1)}
        onSelect={(nextMode, id) => choose(nextMode, id)}
        onClose={() => setPickerOpen(false)}
      />
      <SettingsSheet
        open={settingsOpen}
        viewMode={viewMode}
        fontSize={fontSize}
        onViewMode={(value) => {
          setViewMode(value);
          scheduleSave();
        }}
        onFontSize={(value) => {
          setFontSize(value);
          scheduleSave();
        }}
        onClose={() => setSettingsOpen(false)}
      />
      <AudioSheet
        open={audioOpen}
        reciter={reciter}
        onSelect={changeReciter}
        onClose={() => setAudioOpen(false)}
      />
    </div>
  );
}
