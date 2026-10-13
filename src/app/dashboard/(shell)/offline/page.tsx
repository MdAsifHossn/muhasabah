"use client";

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  HardDrive,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { PageHeader, StatCard } from "@/components/dashboard/common";
import { InstallHint } from "@/components/pwa/pwa-install";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  OfflineQuranError,
  type BatchState,
  type OfflineAyah,
  type StorageInfo,
  type SwState,
  TOTAL_SURAHS,
  clearQuranCache,
  downloadSurahs,
  estimateStorage,
  fetchSurah,
  formatBytes,
  getServiceWorkerState,
  readManifest,
  reconcileManifest,
  requestPagePrecache,
  toBn,
} from "@/lib/offline-quran";
import { SURAH_LIST } from "@/lib/quran";
import { cn } from "@/lib/utils";

const FIRST_TEN = Array.from({ length: 10 }, (_, index) => index + 1);
const ALL_SURAHS = Array.from({ length: TOTAL_SURAHS }, (_, index) => index + 1);
/** Pinned into the page cache by the worker so this route works offline. */
const OFFLINE_PAGE_PATH = "/dashboard/offline";

type ReadState = {
  surah: number;
  loading: boolean;
  ayahs: OfflineAyah[];
  error: string | null;
  canSave: boolean;
  cacheState: string | null;
};

const EMPTY_READ: ReadState = {
  surah: 0,
  loading: false,
  ayahs: [],
  error: null,
  canSave: false,
  cacheState: null,
};

/** Live connectivity straight from the browser's online/offline events. */
function subscribeOnlineStatus(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** SSR snapshot assumes online — the effect below reconciles right after mount. */
function useOnlineStatus() {
  return useSyncExternalStore(subscribeOnlineStatus, () => navigator.onLine, () => true);
}

export default function OfflineQuranPage() {
  const [saved, setSaved] = useState<number[]>([]);
  const online = useOnlineStatus();
  const [storage, setStorage] = useState<StorageInfo>({ usage: null, quota: null, percent: null });
  const [storageSupported, setStorageSupported] = useState(true);
  const [swState, setSwState] = useState<SwState | null>(null);
  const [batch, setBatch] = useState<BatchState | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [query, setQuery] = useState("");
  const [read, setRead] = useState<ReadState>(EMPTY_READ);

  const cancelledRef = useRef(false);
  const runningRef = useRef(false);
  const readTokenRef = useRef(0);

  const refreshStatus = useCallback(async () => {
    const manifest = await reconcileManifest();
    setSaved(manifest);
    setStorage(await estimateStorage());
    setStorageSupported(typeof navigator !== "undefined" && Boolean(navigator.storage?.estimate));
    setSwState(await getServiceWorkerState());
  }, []);

  useEffect(() => {
    // refreshStatus is async — every setState inside it happens after an
    // `await`, so nothing cascades synchronously from this effect (the rule's
    // transitive heuristic can't see that).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshStatus();
    // Pin this route's HTML so /dashboard/offline opens even with no network.
    requestPagePrecache(OFFLINE_PAGE_PATH);
  }, [refreshStatus]);

  /* ── offline reader ────────────────────────────────────────────────── */

  const loadSurah = useCallback(async (surah: number) => {
    const token = ++readTokenRef.current;
    setRead({ ...EMPTY_READ, surah, loading: true });
    try {
      const result = await fetchSurah(surah);
      if (readTokenRef.current !== token) return;
      setRead({
        surah,
        loading: false,
        ayahs: result.ayahs,
        error: null,
        canSave: false,
        cacheState: result.cacheState,
      });
    } catch (error) {
      if (readTokenRef.current !== token) return;
      const offlineMiss = error instanceof OfflineQuranError && error.code === "offline-miss";
      const message =
        error instanceof OfflineQuranError
          ? offlineMiss
            ? "অফলাইনে এই সূরাটি সেভ করা নেই — ইন্টারনেট সংযোগ থাকলে নিচের বাটনে চেপে সেভ করুন।"
            : error.message
          : "কুরআনের তথ্য পাওয়া যায়নি।";
      setRead({ surah, loading: false, ayahs: [], error: message, canSave: offlineMiss, cacheState: null });
    }
  }, []);

  /* ── downloads ─────────────────────────────────────────────────────── */

  const runBatch = useCallback(
    async (targets: number[]) => {
      if (runningRef.current) return;
      const pending = targets.filter((surah) => !saved.includes(surah));
      if (pending.length === 0) {
        setNotice("এই তালিকার সব সূরা আগে থেকেই সেভ করা আছে।");
        return;
      }
      runningRef.current = true;
      cancelledRef.current = false;
      setNotice(null);
      setBatch({ total: pending.length, completed: 0, saved: 0, failed: 0, failures: [], running: true });
      try {
        const result = await downloadSurahs(pending, {
          concurrency: 4,
          isCancelled: () => cancelledRef.current,
          onProgress: (state) => {
            setBatch(state);
            setSaved(readManifest());
          },
        });
        setBatch({
          total: pending.length,
          completed: result.saved.length + result.failures.length,
          saved: result.saved.length,
          failed: result.failures.length,
          failures: result.failures,
          running: false,
        });
      } finally {
        runningRef.current = false;
        setSaved(readManifest());
        setStorage(await estimateStorage());
      }
    },
    [saved],
  );

  const cancelBatch = () => {
    cancelledRef.current = true;
  };

  const saveOne = useCallback(
    async (surah: number) => {
      if (runningRef.current) return;
      runningRef.current = true;
      setNotice(null);
      setBatch({ total: 1, completed: 0, saved: 0, failed: 0, failures: [], running: true });
      try {
        const result = await downloadSurahs([surah], {
          concurrency: 1,
          onProgress: (state) => setBatch(state),
        });
        setBatch({
          total: 1,
          completed: result.saved.length + result.failures.length,
          saved: result.saved.length,
          failed: result.failures.length,
          failures: result.failures,
          running: false,
        });
        if (result.saved.length > 0) await loadSurah(surah);
      } finally {
        runningRef.current = false;
        setSaved(readManifest());
        setStorage(await estimateStorage());
      }
    },
    [loadSurah],
  );

  const clearAll = async () => {
    if (!window.confirm("শুধু কুরআনের সেভ করা ডেটা মুছে ফেলবেন? অ্যাপের বাকি ক্যাশে অক্ষত থাকবে।")) return;
    setRemoving(true);
    try {
      await clearQuranCache();
      setSaved([]);
      setRead(EMPTY_READ);
      setBatch(null);
      setStorage(await estimateStorage());
    } finally {
      setRemoving(false);
    }
  };

  /* ── derived ───────────────────────────────────────────────────────── */

  const progress = useMemo(() => {
    if (!batch || batch.total === 0) return 0;
    return Math.min(100, Math.round((batch.completed / batch.total) * 100));
  }, [batch]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return SURAH_LIST;
    return SURAH_LIST.filter((surah) =>
      `${surah.number} ${surah.banglaName} ${surah.englishName}`.toLowerCase().includes(needle),
    );
  }, [query]);

  const savedSet = useMemo(() => new Set(saved), [saved]);
  const readyCount = savedSet.size;
  const running = Boolean(batch?.running);
  const failures = batch?.failures ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow="অফলাইন • আল-কুরআন"
        title="কুরআন অফলাইনে সেভ করুন"
        description="ইন্টারনেট থাকলে সূরাগুলো একবার সেভ করে রাখুন — এরপর নেট ছাড়াই এই পেজে পড়তে পারবেন।"
        action={{ label: "ফুল রিডার", href: "/dashboard/quran" }}
      />

      {/* ── Status ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="অফলাইনে প্রস্তুত"
          value={`${toBn(readyCount)}/${toBn(TOTAL_SURAHS)} সূরা`}
          note="সেভ করা সূরা"
          icon={CheckCircle2}
        />
        <StatCard
          label="স্টোরেজ ব্যবহৃত"
          value={storage.usage === null ? "—" : formatBytes(storage.usage)}
          note={
            storage.percent !== null
              ? `কোটার ${toBn(storage.percent)}%`
              : storageSupported
                ? "মোট ক্যাশে"
                : "এই ব্রাউজারে সাপোর্ট নেই"
          }
          icon={HardDrive}
        />
        <StatCard
          label="সংযোগ"
          value={online ? "অনলাইন" : "অফলাইন"}
          note={online ? "নেটওয়ার্ক আছে" : "নেট ছাড়াই পড়া যাবে"}
          icon={online ? Wifi : WifiOff}
        />
        <StatCard
          label="সার্ভিস ওয়ার্কার"
          value={
            swState === null ? "…" : swState === "ready" ? "সক্রিয়" : swState === "pending" ? "চালু হচ্ছে" : "নেই"
          }
          note="অফলাইন সাপোর্ট"
          icon={RefreshCw}
        />
      </div>

      <InstallHint />

      {/* ── Download controls ──────────────────────────────────────── */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-emerald-950">সূরা সেভ করুন</h2>
              <p className="mt-1 text-sm leading-6 text-stone-500">
                একসাথে সর্বোচ্চ ৪টি করে ডাউনলোড হবে, একটি ব্যর্থ হলেও বাকিগুলো চলতে থাকবে। আগে সেভ
                করা সূরা বাদ যাবে, তাই যেকোনো সময় থামিয়ে আবার শুরু করলে বাকি অংশ থেকেই নেবে।
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={clearAll}
              disabled={removing || readyCount === 0}
              className="shrink-0 text-red-700"
            >
              {removing ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              সব মুছুন
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {running ? (
              <Button type="button" variant="outline" onClick={cancelBatch}>
                এখনই থামান
              </Button>
            ) : (
              <>
                <Button type="button" onClick={() => void runBatch(FIRST_TEN)}>
                  <Download className="size-4" /> শুরুর ১০ সূরা
                </Button>
                <Button type="button" onClick={() => void runBatch(ALL_SURAHS)}>
                  <Download className="size-4" /> পুরো কুরআন ({toBn(TOTAL_SURAHS)} সূরা)
                </Button>
              </>
            )}
            {!running && failures.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void runBatch(failures)}
              >
                <RefreshCw className="size-4" /> ব্যর্থগুলো আবার ({toBn(failures.length)})
              </Button>
            ) : null}
          </div>

          {notice ? (
            <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
              {notice}
            </p>
          ) : null}

          {batch ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-600">
                <span>
                  {batch.running ? "সেভ হচ্ছে…" : "সম্পন্ন"}
                  {batch.total > 0 ? ` • ${toBn(batch.completed)}/${toBn(batch.total)} সূরা` : ""}
                </span>
                <span>{toBn(progress)}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300",
                    batch.running ? "bg-emerald-600" : batch.failed > 0 ? "bg-amber-500" : "bg-emerald-700",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="size-3.5" /> সফল: {toBn(batch.saved)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 font-semibold",
                    batch.failed > 0 ? "text-red-600" : "text-stone-400",
                  )}
                >
                  <AlertCircle className="size-3.5" /> ব্যর্থ: {toBn(batch.failed)}
                </span>
                {!batch.running && batch.failed > 0 ? (
                  <span className="text-stone-500">নেট ঠিক থাকলে “ব্যর্থগুলো আবার” চাপুন।</span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs leading-5 text-stone-400">
              সেভ করা সূরার পাশে <b>সেভ করা</b> ব্যাজ দেখা যাবে।
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Offline reader ─────────────────────────────────────────── */}
      {read.surah > 0 ? (
        <Card className="border-emerald-200">
          <CardContent>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                  অফলাইন রিডার
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold normal-case tracking-normal",
                      online ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
                    )}
                  >
                    {online ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
                    {online ? "অনলাইন" : "অফলাইন"}
                  </span>
                  {read.cacheState ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-bold normal-case tracking-normal text-stone-600">
                      {read.cacheState === "hit"
                        ? "ক্যাশ থেকে"
                        : read.cacheState === "miss"
                          ? "নতুন ডেটা"
                          : "নেটওয়ার্ক"}
                    </span>
                  ) : null}
                </p>
                <h2 className="mt-1 truncate text-xl font-bold text-emerald-950">
                  {SURAH_LIST[read.surah - 1]?.banglaName ?? `সূরা ${toBn(read.surah)}`}
                </h2>
                <p className="mt-0.5 text-xs text-stone-500">
                  {SURAH_LIST[read.surah - 1]?.englishName} •{" "}
                  {toBn(SURAH_LIST[read.surah - 1]?.numberOfAyahs ?? 0)} আয়াত
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRead(EMPTY_READ)}
                aria-label="রিডার বন্ধ করুন"
                className="grid size-9 shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 active:bg-stone-100"
              >
                <ArrowLeft className="size-4" />
              </button>
            </div>

            {read.loading ? (
              <div className="grid min-h-40 place-items-center text-emerald-800">
                <div className="text-center">
                  <Loader2 className="mx-auto size-7 animate-spin" />
                  <p className="mt-3 text-sm font-bold">আয়াত লোড হচ্ছে…</p>
                </div>
              </div>
            ) : read.error ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
                <AlertCircle className="mx-auto size-6 text-amber-700" />
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">{read.error}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {read.canSave && online ? (
                    <Button type="button" size="sm" onClick={() => void saveOne(read.surah)}>
                      <Download className="size-4" /> এখন সেভ করুন
                    </Button>
                  ) : null}
                  <Button type="button" size="sm" variant="outline" onClick={() => void loadSurah(read.surah)}>
                    <RefreshCw className="size-4" /> আবার চেষ্টা
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {read.surah !== 1 && read.surah !== 9 ? (
                  <p
                    dir="rtl"
                    className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-center font-serif text-xl text-emerald-950"
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </p>
                ) : null}
                {read.ayahs.map((ayah) => (
                  <div key={ayah.number} className="rounded-2xl border border-stone-200 bg-white p-4">
                    <div className="flex items-start gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-black text-emerald-800">
                        {toBn(ayah.numberInSurah)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p dir="rtl" className="font-serif text-2xl leading-[2.4] text-emerald-950">
                          {ayah.arabic}
                        </p>
                        {ayah.bangla ? (
                          <p className="mt-2 text-sm leading-7 text-stone-600">{ayah.bangla}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Surah list ─────────────────────────────────────────────── */}
      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-emerald-950">সূরার তালিকা</h2>
              <p className="mt-1 text-sm leading-6 text-stone-500">
                পড়তে চাওয়া সূরায় চাপ দিন — সেভ করা থাকলে নেট ছাড়াই খুলবে।
              </p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 size-4 text-stone-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="সূরা খুঁজুন..."
                aria-label="সূরা খুঁজুন"
                className="h-10 w-full rounded-xl border border-stone-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 sm:w-56"
              />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm font-semibold text-stone-500">
                কোনো সূরা পাওয়া যায়নি
              </p>
            ) : (
              filtered.map((surah) => {
                const isSaved = savedSet.has(surah.number);
                const active = read.surah === surah.number;
                return (
                  <button
                    key={surah.number}
                    type="button"
                    onClick={() => void loadSurah(surah.number)}
                    className={cn(
                      "flex min-h-14 w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors",
                      active ? "bg-emerald-950 text-white" : "active:bg-emerald-50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black",
                        active
                          ? "bg-amber-400 text-emerald-950"
                          : isSaved
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-stone-100 text-stone-500",
                      )}
                    >
                      {toBn(surah.number)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-sm">{surah.banglaName}</b>
                      <small
                        className={cn(
                          "block truncate text-xs",
                          active ? "text-emerald-200" : "text-stone-400",
                        )}
                      >
                        {surah.englishName} • {toBn(surah.numberOfAyahs)} আয়াত
                      </small>
                    </span>
                    {isSaved ? (
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold",
                          active ? "bg-emerald-800 text-white" : "bg-emerald-50 text-emerald-700",
                        )}
                      >
                        <BookOpen className="size-3" /> সেভ করা
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "shrink-0 text-[11px] font-semibold",
                          active ? "text-emerald-200" : "text-stone-300",
                        )}
                      >
                        নেই
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
