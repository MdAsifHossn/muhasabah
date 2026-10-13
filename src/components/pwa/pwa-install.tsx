"use client";

import { Download, Share, Smartphone, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  APP_INSTALLED_EVENT,
  INSTALL_PROMPT_EVENT,
  type InstallPromptEvent,
} from "./pwa-provider";

const STORAGE_KEY = "muhasabah.install-dismissed";

/** Never fires — subscribe fn for browser-only values read via useSyncExternalStore. */
const emptySubscribe = () => () => {};

/** True once rendering runs in the browser (false during SSR + hydration pass). */
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/**
 * Floating "install" affordance. It only appears once the browser reports the
 * app is installable (Chrome/Android, Edge, desktop Chromium) — the event
 * itself is re-broadcast by `PwaProvider` — stays hidden once the app is
 * installed, and remembers an explicit dismissal.
 *
 * On iOS Safari the event never fires, so the pill stays hidden there and the
 * user installs from the Share sheet instead.
 */
export function PwaInstall() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const mounted = useMounted();

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;

    const onInstallPrompt = (event: Event) => {
      setPrompt((event as CustomEvent).detail as InstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setPrompt(null);
    };

    window.addEventListener(INSTALL_PROMPT_EVENT, onInstallPrompt);
    window.addEventListener(APP_INSTALLED_EVENT, onInstalled);
    return () => {
      window.removeEventListener(INSTALL_PROMPT_EVENT, onInstallPrompt);
      window.removeEventListener(APP_INSTALLED_EVENT, onInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome !== "accepted") return;
    } catch {
      return; // prompt already consumed or unsupported — just hide quietly
    }
    setVisible(false);
    setPrompt(null);
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    setPrompt(null);
  }

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="অ্যাপ ইনস্টল"
      className={`fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 flex items-center gap-2 rounded-2xl border border-emerald-800 bg-emerald-950 p-2 pl-4 text-white shadow-2xl transition-all duration-300 sm:right-auto sm:w-96 lg:bottom-6 lg:left-6 lg:right-auto ${
        mounted ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold leading-5">মুহাসাবাহ অ্যাপ ইনস্টল করুন</p>
        <p className="truncate text-[11px] leading-4 text-emerald-200/80">
          হোমস্ক্রিন থেকে এক ট্যাপে খুলুন — অ্যাপের মতো চলবে।
        </p>
      </div>
      <button
        type="button"
        onClick={install}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-black text-emerald-950 active:bg-amber-300"
      >
        <Download className="size-3.5" /> ইনস্টল করুন
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="বন্ধ করুন"
        className="grid size-8 shrink-0 place-items-center rounded-xl text-emerald-200 active:bg-emerald-900"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

type InstallPlatform = "ios" | "other";

/**
 * Static "how to install" card used inside the offline Quran page.
 *
 * `beforeinstallprompt` never fires on iOS Safari, so no button can trigger an
 * install there — the user has to use the Share sheet. This card explains that
 * path (and the browser-menu path elsewhere) instead of silently doing
 * nothing. It renders nothing once the app is already running standalone.
 */
/**
 * Detects how (and whether) the current browser can install the app: returns
 * null while running on the server or when the app is already standalone,
 * "ios" on iOS Safari (no `beforeinstallprompt` event — the user installs
 * from the Share sheet) and "other" everywhere the install button can work.
 */
function detectInstallPlatform(): InstallPlatform | null {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
  if (standalone) return null;

  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "other";
}

export function InstallHint({ className }: { className?: string }) {
  const platform = useSyncExternalStore(emptySubscribe, detectInstallPlatform, () => null);

  if (platform === null) return null;

  return (
    <div
      role="region"
      aria-label="অ্যাপ ইনস্টল"
      className={`flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 ${className ?? ""}`}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-900 text-amber-300">
        {platform === "ios" ? <Share className="size-4" /> : <Download className="size-4" />}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-950">
          <Smartphone className="size-3.5" /> অ্যাপ হিসেবে ইনস্টল করুন
        </p>
        {platform === "ios" ? (
          <p className="mt-1 text-xs leading-5 text-stone-600">
            Safari-এ খুলে <b>Share</b> বাটনে চাপুন → নিচে স্ক্রল করে{" "}
            <b>হোমস্ক্রিনে যোগ করুন</b> ট্যাপ করুন। এতে অফলাইনে পড়ার জন্য অ্যাপ আলাদা আইকনে
            চলবে।
          </p>
        ) : (
          <p className="mt-1 text-xs leading-5 text-stone-600">
            ব্রাউজারের মেনু থেকে <b>অ্যাপ ইনস্টল করুন</b> / <b>হোমস্ক্রিনে যোগ করুন</b> চাপুন —
            ইনস্টল করলে এক ট্যাপে খুলবে এবং অফলাইনেও চলবে।
          </p>
        )}
      </div>
    </div>
  );
}
