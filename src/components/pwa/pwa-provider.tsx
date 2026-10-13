"use client";

import { useEffect, type ReactNode } from "react";

/** Namespaced events this provider dispatches on `window`. */
export const INSTALL_PROMPT_EVENT = "muhasabah:installprompt";
export const APP_INSTALLED_EVENT = "muhasabah:appinstalled";

/**
 * The (slimmed) shape of the browser's `BeforeInstallPromptEvent` we hand to
 * the rest of the app.
 */
export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Boots the web app service worker (offline shell + installability), keeps the
 * browser from serving stale chunks after a deploy, and re-broadcasts the
 * browser's `beforeinstallprompt` as a namespaced event so any component can
 * offer installation.
 *
 * The service worker is only registered for production builds, or when it is
 * explicitly opted into: in development Next.js serves freshly compiled chunks
 * from stable URLs, and caching them would fight HMR and hand other parts of
 * the app stale code. Two escape hatches exist:
 *
 *   1. Build/run-time: `NEXT_PUBLIC_ENABLE_SW=1`
 *      (PowerShell: `$env:NEXT_PUBLIC_ENABLE_SW="1"; npm run dev`)
 *   2. Runtime, without restarting the dev server: open any page as
 *      `http://localhost:3000/?enable-sw=1` (persists in localStorage;
 *      `?enable-sw=0` turns it back off).
 *
 * Everything here runs inside `useEffect`, i.e. browser only, and every failure
 * is swallowed: losing offline support must never break the app.
 */

/** localStorage key for the runtime opt-in (escape hatch #2 above). */
const SW_FLAG_KEY = "muhasabah.enable-sw";
/**
 * Runtime opt-in for the service worker: opening any page with
 * `?enable-sw=1` registers the worker from the next load onwards (and
 * `?enable-sw=0` removes it again) — useful when the dev server was started
 * without `NEXT_PUBLIC_ENABLE_SW`. Deliberately does not touch history/state,
 * so it cannot disturb the app router.
 */
function readSwOptIn(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get("enable-sw");
    if (param === "1") localStorage.setItem(SW_FLAG_KEY, "1");
    else if (param === "0") localStorage.removeItem(SW_FLAG_KEY);
    return localStorage.getItem(SW_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function PwaProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    /* ── install-prompt plumbing (works in every environment) ───────── */
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_EVENT, { detail: event }));
    };
    const onInstalled = () => {
      window.dispatchEvent(new CustomEvent(APP_INSTALLED_EVENT));
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    /* ── service worker (production, or dev with NEXT_PUBLIC_ENABLE_SW=1) ── */
    let detached = false;
    let registration: ServiceWorkerRegistration | undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") registration?.update().catch(() => {});
    };

    const register = async () => {
      if (detached || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
      try {
        registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        registration.update().catch(() => {});
      } catch {
        /* offline support is progressive enhancement — never break the app */
      }
    };

    const swWanted =
      process.env.NODE_ENV === "production" ||
      process.env.NEXT_PUBLIC_ENABLE_SW === "1" ||
      readSwOptIn();

    if (swWanted) {
      if (document.readyState === "complete") void register();
      else window.addEventListener("load", register, { once: true });
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    // Reload once when an updated worker takes over — but never on the very
    // first install, which would flash-reload the page the user just opened.
    // (Guarded: `navigator.serviceWorker` is undefined in insecure contexts.)
    const swContainer = typeof navigator !== "undefined" ? navigator.serviceWorker : undefined;
    let refreshing = false;
    let firstInstall = !swContainer?.controller;
    const onControllerChange = () => {
      if (firstInstall) {
        firstInstall = false;
        return;
      }
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    swContainer?.addEventListener("controllerchange", onControllerChange);

    return () => {
      detached = true;
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("load", register);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      swContainer?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return children;
}
