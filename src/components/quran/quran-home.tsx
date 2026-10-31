"use client";

import { ArrowLeft, Bookmark, BookOpen, ChevronRight, Heart, Search, Settings2, Sparkles, WifiOff, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SettingsSheet } from "@/components/quran/settings-sheet";
import { useBookmarks, useFavouriteSurahs, useLastRead, usePrefs } from "@/components/quran/storage";
import { readerThemeStyle } from "@/components/quran/themes";
import { bnNum, JUZ_STARTS, shortBanglaName, SURAH_LIST, type Surah } from "@/lib/quran";
import { TOTAL_AYAHS, type QuranProgressRecord } from "@/lib/quran-progress";
import { cn } from "@/lib/utils";

type Tab = "surah" | "juz" | "saved";

/** Surahs people open most — quick chips under the hero. */
const POPULAR = [18, 36, 55, 56, 67];

const BN_TO_EN: Record<string, string> = { "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9" };

function normalizeQuery(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[০-৯]/g, (digit) => BN_TO_EN[digit])
    .replace(/[-'’\s]/g, "");
}

function matches(surah: Surah, query: string) {
  if (!query) return true;
  if (/^\d+$/.test(query)) return String(surah.number).startsWith(query);
  const haystack = normalizeQuery(`${surah.banglaName} ${surah.englishName} ${surah.englishMeaning} ${surah.banglaMeaning}`);
  return haystack.includes(query);
}

/** Medallion with the surah / para number. */
function NumberBadge({ value }: { value: number }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center text-sm font-bold text-primary">
      <svg viewBox="0 0 44 44" className="absolute inset-0 size-full text-primary/35" aria-hidden>
        <path d="M22 2l5.6 6.5 8.5-.6.6 8.5L43 22l-6.3 5.6-.6 8.5-8.5-.6L22 42l-5.6-6.5-8.5.6-.6-8.5L1 22l6.3-5.6.6-8.5 8.5.6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span className="relative">{bnNum(value)}</span>
    </span>
  );
}

export function QuranHome({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [tab, setTab] = useState<Tab>("surah");
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState<QuranProgressRecord | null>(null);
  const lastRead = useLastRead();
  const [bookmarks] = useBookmarks();
  const [favourites, toggleFavourite] = useFavouriteSurahs();
  const favouriteSet = useMemo(() => new Set(favourites), [favourites]);
  const [prefs, setPrefs] = usePrefs();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    fetch("/api/quran/progress", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<QuranProgressRecord | null>) : null))
      .then((record) => {
        if (active) setProgress(record);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  const normalized = normalizeQuery(query);
  const surahs = useMemo(() => SURAH_LIST.filter((surah) => matches(surah, normalized)), [normalized]);

  // Most recent of the device position and the account position.
  const resume = useMemo(() => {
    const server = progress
      ? { mode: progress.mode, id: progress.mode === "juz" ? (progress.juz ?? 1) : progress.surah, surah: progress.surah, ayah: progress.ayahInSurah, at: progress.updatedAt ? Date.parse(progress.updatedAt) : 0 }
      : null;
    if (lastRead && (!server || lastRead.at >= server.at)) return lastRead;
    return server;
  }, [lastRead, progress]);

  const readPercent = progress ? Math.round((progress.readAyahs.length / TOTAL_AYAHS) * 1000) / 10 : null;
  const resumeSurah = resume ? SURAH_LIST[resume.surah - 1] : null;
  const resumeHref = resume
    ? resume.mode === "juz"
      ? `/quran?juz=${resume.id}&s=${resume.surah}&ayah=${resume.ayah}`
      : `/quran?surah=${resume.surah}&ayah=${resume.ayah}`
    : "/quran?surah=1";

  return (
    <div style={readerThemeStyle(prefs.theme)} data-script={prefs.script} className="min-h-dvh bg-background pb-[calc(2rem+env(safe-area-inset-bottom))] text-foreground">
      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-30 border-b border-hairline pt-[env(safe-area-inset-top)] backdrop-blur-xl"
        style={{ background: "var(--reader-bar, color-mix(in srgb, var(--background) 88%, transparent))" }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3 sm:px-4">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            aria-label="ফিরে যান"
            className="grid size-10 place-items-center rounded-xl text-muted-foreground transition hover:bg-surface-sunken hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-foreground">আল-কুরআনুল কারীম</h1>
          {isLoggedIn ? (
            <Link
              href="/dashboard/offline"
              aria-label="অফলাইন কুরআন"
              className="grid size-10 place-items-center rounded-xl border border-hairline bg-surface text-muted-foreground transition hover:text-foreground"
            >
              <WifiOff className="size-[18px]" />
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="পড়ার সেটিংস"
            className="grid size-10 place-items-center rounded-xl border border-hairline bg-surface text-muted-foreground transition hover:text-foreground"
          >
            <Settings2 className="size-[18px]" />
          </button>
        </div>
      </header>
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} prefs={prefs} onChange={setPrefs} />

      <main className="mx-auto max-w-3xl px-4 pt-4 sm:pt-6">
        {/* ── Continue reading ── */}
        <section className="hero-surface relative overflow-hidden rounded-card p-5 shadow-raised sm:p-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-on-hero-muted">
            <Sparkles className="size-3.5 text-amber-300" />
            {resume ? "যেখানে থেমেছিলেন" : "পড়া শুরু করুন"}
          </p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold">
                {resumeSurah ? shortBanglaName(resumeSurah) : "সূরা আল-ফাতিহা"}
              </h2>
              <p className="mt-1 text-sm text-on-hero-muted">
                {resume && resumeSurah
                  ? `${resume.mode === "juz" ? `পারা ${bnNum(resume.id)} • ` : ""}আয়াত ${bnNum(resume.ayah)} / ${bnNum(resumeSurah.numberOfAyahs)}`
                  : "কুরআনের সূচনা — ৭ আয়াত"}
              </p>
            </div>
            <p dir="rtl" className="quran-text shrink-0 text-3xl leading-none text-amber-200/90">
              {resumeSurah?.name.replace(/^سُورَةُ\s*/, "") ?? "ٱلْفَاتِحَة"}
            </p>
          </div>
          {readPercent !== null ? (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-on-hero-muted">
                <span>মোট পড়া হয়েছে</span>
                <span className="font-bold text-on-hero">{bnNum(progress?.readAyahs.length ?? 0)} / {bnNum(TOTAL_AYAHS)} আয়াত ({bnNum(readPercent)}%)</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, readPercent)}%` }} />
              </div>
            </div>
          ) : null}
          <Link
            href={resumeHref}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-bold text-[#2a1d02] shadow-sm transition hover:brightness-105 active:scale-[0.98]"
          >
            <BookOpen className="size-4" />
            {resume ? "পড়া চালিয়ে যান" : "পড়া শুরু করুন"}
          </Link>
        </section>

        {/* ── Popular surahs ── */}
        <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {POPULAR.map((number) => {
            const surah = SURAH_LIST[number - 1];
            return (
              <Link
                key={number}
                href={`/quran?surah=${number}`}
                className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-hairline bg-surface px-3.5 py-2.5 shadow-card transition hover:border-hairline-strong active:scale-[0.98]"
              >
                <span>
                  <span className="block text-sm font-semibold text-foreground">{shortBanglaName(surah)}</span>
                  <span className="block text-[11px] text-muted-foreground">{bnNum(surah.numberOfAyahs)} আয়াত</span>
                </span>
                <BookOpen className="size-4 text-primary" />
              </Link>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div role="tablist" aria-label="তালিকা" className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-hairline bg-surface-sunken p-1">
          {(
            [
              ["surah", "সূরা"],
              ["juz", "পারা"],
              ["saved", `প্রিয়${favourites.length + bookmarks.length ? ` (${bnNum(favourites.length + bookmarks.length)})` : ""}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={cn(
                "h-10 rounded-lg text-sm font-semibold transition",
                tab === value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "surah" ? (
          <>
            <label className="relative mt-3 block">
              <span className="sr-only">সূরা খুঁজুন</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-subtle-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="সূরার নাম বা নম্বর লিখুন… (যেমন: ইয়াসীন, 36)"
                inputMode="search"
                className="h-12 w-full rounded-xl border border-hairline-strong bg-surface pl-11 pr-11 text-base text-foreground placeholder:text-subtle-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
              />
              {query ? (
                <button
                  type="button"
                  aria-label="মুছুন"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-surface-sunken"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </label>

            <ul className="mt-3 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-card">
              {surahs.map((surah) => (
                <li key={surah.number} className="flex items-center">
                  <Link
                    href={`/quran?surah=${surah.number}`}
                    className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 transition hover:bg-surface-sunken active:bg-surface-sunken sm:pl-4"
                  >
                    <NumberBadge value={surah.number} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{shortBanglaName(surah)}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {surah.banglaMeaning} • {bnNum(surah.numberOfAyahs)} আয়াত • {surah.revelationType === "Meccan" ? "মাক্কী" : "মাদানী"}
                      </span>
                    </span>
                    <span dir="rtl" className="quran-text shrink-0 text-xl leading-none text-primary">
                      {surah.name.replace(/^سُورَةُ\s*/, "")}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFavourite(surah.number)}
                    aria-pressed={favouriteSet.has(surah.number)}
                    aria-label={favouriteSet.has(surah.number) ? "প্রিয় থেকে সরান" : "প্রিয়তে রাখুন"}
                    className={cn("grid size-11 shrink-0 place-items-center transition", favouriteSet.has(surah.number) ? "text-rose-500" : "text-subtle-foreground hover:text-rose-500")}
                  >
                    <Heart className={cn("size-[18px]", favouriteSet.has(surah.number) && "fill-current")} />
                  </button>
                </li>
              ))}
              {surahs.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-muted-foreground">“{query}” নামে কোনো সূরা পাওয়া যায়নি।</li>
              ) : null}
            </ul>
          </>
        ) : null}

        {tab === "juz" ? (
          <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {JUZ_STARTS.map(([surahNumber, ayah], index) => {
              const surah = SURAH_LIST[surahNumber - 1];
              return (
                <li key={index}>
                  <Link
                    href={`/quran?juz=${index + 1}`}
                    className="flex h-full items-center gap-3 rounded-card border border-hairline bg-surface p-3 shadow-card transition hover:border-hairline-strong active:scale-[0.98]"
                  >
                    <NumberBadge value={index + 1} />
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">পারা {bnNum(index + 1)}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {shortBanglaName(surah)} {bnNum(surahNumber)}:{bnNum(ayah)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        {tab === "saved" && favourites.length ? (
          <>
            <h3 className="mt-4 text-xs font-bold tracking-wide text-muted-foreground">প্রিয় সূরা</h3>
            <ul className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {favourites.map((number) => {
                const surah = SURAH_LIST[number - 1];
                if (!surah) return null;
                return (
                  <li key={number}>
                    <Link href={`/quran?surah=${number}`} className="flex h-full items-center gap-3 rounded-card border border-hairline bg-surface p-3 shadow-card transition hover:border-hairline-strong active:scale-[0.98]">
                      <NumberBadge value={number} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-foreground">{shortBanglaName(surah)}</span>
                        <span className="block truncate text-xs text-muted-foreground">{bnNum(surah.numberOfAyahs)} আয়াত</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        {tab === "saved" ? (
          bookmarks.length ? (
            <>
            <h3 className="mt-4 text-xs font-bold tracking-wide text-muted-foreground">বুকমার্ক করা আয়াত</h3>
            <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-card border border-hairline bg-surface shadow-card">
              {bookmarks.map((item) => {
                const surah = SURAH_LIST[item.surah - 1];
                return (
                  <li key={`${item.surah}:${item.ayah}`}>
                    <Link href={`/quran?surah=${item.surah}&ayah=${item.ayah}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-sunken">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
                        <Bookmark className="size-[18px] fill-current" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-foreground">{surah ? shortBanglaName(surah) : `সূরা ${bnNum(item.surah)}`}</span>
                        <span className="block text-xs text-muted-foreground">
                          আয়াত {bnNum(item.ayah)} • {new Date(item.at).toLocaleDateString("bn-BD", { day: "numeric", month: "long" })}
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-subtle-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
            </>
          ) : favourites.length ? null : (
            <div className="mt-3 rounded-card border border-dashed border-hairline-strong bg-surface px-5 py-12 text-center">
              <Bookmark className="mx-auto size-8 text-subtle-foreground" />
              <p className="mt-3 font-semibold text-foreground">এখনো কিছু রাখা হয়নি</p>
              <p className="mt-1 text-sm text-muted-foreground">সূরার পাশের ♡ চাপুন, বা পড়ার সময় আয়াত বুকমার্ক করুন — এখানে জমা থাকবে।</p>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
