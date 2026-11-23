"use client";

import { BellRing, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useReminderSettings } from "@/components/prayer/reminder-store";
import { enablePush, pushSupported, subscriptionIsCurrent, VAPID_PUBLIC_KEY } from "@/lib/push-client";
import { usePrayerLocation } from "@/lib/use-prayer-location";

const SNOOZE_KEY = "prayer.push.prompt.until";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Push is ON by default for signed-in members:
 *  - permission already granted → the device is registered silently;
 *  - permission not asked yet   → one friendly card (the browser only allows a prompt after a tap);
 *  - blocked, unsupported, or the member switched push off → nothing, never nagging.
 */
export function PushAutoEnable() {
  const [settings, update] = useReminderSettings();
  const location = usePrayerLocation();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const prefs = { waqt: settings.waqt, forbidden: settings.forbidden, messages: settings.pushMessages };

  useEffect(() => {
    if (!VAPID_PUBLIC_KEY || !pushSupported() || settings.pushOptOut) return;
    let active = true;
    (async () => {
      if (await subscriptionIsCurrent()) return;
      if (Notification.permission === "granted") {
        await enablePush(location, { waqt: settings.waqt, forbidden: settings.forbidden, messages: settings.pushMessages });
        return;
      }
      if (Notification.permission !== "default") return;
      let until = 0;
      try {
        until = Number(window.localStorage.getItem(SNOOZE_KEY)) || 0;
      } catch {
        /* storage blocked */
      }
      if (active && Date.now() > until) setShow(true);
    })();
    return () => {
      active = false;
    };
    // run on first load / when the opt-out changes — not on every settings tweak
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.pushOptOut]);

  function snooze() {
    try {
      window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  async function accept() {
    if (busy) return;
    setBusy(true);
    const result = await enablePush(location, prefs);
    setBusy(false);
    if (result.ok) {
      update({ pushOptOut: false });
      toast.success("পুশ চালু হয়েছে — সাইট বন্ধ থাকলেও ফোনে জানানো হবে।");
      setShow(false);
    } else {
      toast.error(result.reason);
      snooze();
    }
  }

  if (!show) return null;
  return (
    <div
      role="dialog"
      aria-label="নোটিফিকেশন চালু করুন"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border border-border-strong bg-background p-4 shadow-2xl sm:left-auto sm:right-4 sm:w-96 lg:bottom-6"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
          <BellRing className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">ওয়াক্তের সময় ফোনে জানাতে চান?</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">নামাজ ও নিষিদ্ধ সময় শুরু হলে এবং নতুন বার্তা এলে সাইট বন্ধ থাকলেও নোটিফিকেশন পাবেন। চাইলে পরে বন্ধ করা যাবে।</p>
        </div>
        <button type="button" onClick={snooze} aria-label="পরে" className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent">
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={accept} disabled={busy} className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-active text-sm font-semibold text-on-active shadow-sm disabled:opacity-70">
          {busy ? <Loader2 className="size-4 animate-spin" /> : null} চালু করুন
        </button>
        <button type="button" onClick={snooze} className="inline-flex h-10 items-center rounded-xl border border-hairline px-4 text-sm font-semibold text-muted-foreground">
          পরে
        </button>
      </div>
    </div>
  );
}
