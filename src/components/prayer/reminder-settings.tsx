"use client";

import { BellRing, Info, MessageCircle, MonitorSmartphone, ShieldAlert, Smartphone } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { useReminderSettings } from "@/components/prayer/reminder-store";
import { Switch } from "@/components/ui/switch";
import { currentSubscription, disablePush, enablePush, pushSupported, VAPID_PUBLIC_KEY } from "@/lib/push-client";
import { usePrayerLocation } from "@/lib/use-prayer-location";

const subscribe = () => () => {};

function Row({ icon: Icon, title, text, checked, onChange }: { icon: typeof BellRing; title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-3.5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs leading-5 text-muted-foreground">{text}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </label>
  );
}

/** Switches for the full-screen reminders and optional browser notifications. */
export function ReminderSettingsCard() {
  const [settings, update] = useReminderSettings();
  const supported = useSyncExternalStore(subscribe, () => typeof Notification !== "undefined", () => true);
  const location = usePrayerLocation();
  const [pushOn, setPushOn] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const pushAvailable = Boolean(VAPID_PUBLIC_KEY);

  useEffect(() => {
    let active = true;
    void currentSubscription().then((subscription) => active && setPushOn(Boolean(subscription) && Notification.permission === "granted"));
    return () => {
      active = false;
    };
  }, []);

  async function togglePush(value: boolean) {
    if (pushBusy) return;
    setPushBusy(true);
    try {
      if (!value) {
        await disablePush();
        setPushOn(false);
        toast.success("পুশ নোটিফিকেশন বন্ধ হয়েছে।");
        return;
      }
      const result = await enablePush(location, { waqt: settings.waqt, forbidden: settings.forbidden, messages: settings.pushMessages });
      if (result.ok) {
        setPushOn(true);
        toast.success("পুশ চালু হয়েছে — সাইট বন্ধ থাকলেও ফোনে জানানো হবে।");
      } else toast.error(result.reason);
    } finally {
      setPushBusy(false);
    }
  }

  async function toggleNotify(value: boolean) {
    if (!value) return update({ notify: false });
    if (typeof Notification === "undefined") {
      toast.error("এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়।");
      return;
    }
    const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    if (permission !== "granted") {
      toast.error("নোটিফিকেশনের অনুমতি দেওয়া হয়নি — ব্রাউজারের সাইট সেটিংস থেকে চালু করতে পারবেন।");
      return update({ notify: false });
    }
    update({ notify: true });
    toast.success("নোটিফিকেশন চালু হয়েছে।");
  }

  return (
    <section className="surface rounded-card p-4 sm:p-6" aria-labelledby="reminder-settings-title">
      <h2 id="reminder-settings-title" className="flex items-center gap-2 text-base font-bold text-foreground sm:text-lg">
        <BellRing className="size-5 text-primary" /> রিমাইন্ডার
      </h2>
      <div className="mt-2 divide-y divide-hairline">
        <Row
          icon={Smartphone}
          title="ফোনে পুশ নোটিফিকেশন"
          text={pushAvailable ? (pushSupported() ? "সাইট বা অ্যাপ বন্ধ থাকলেও ওয়াক্ত শুরু হলে ফোনে জানাবে" : "এই ব্রাউজারে সমর্থিত নয় (আইফোনে অ্যাপ হিসেবে যোগ করে খুলুন)") : "সার্ভারে এখনো চালু করা হয়নি"}
          checked={pushOn}
          onChange={(value) => void togglePush(value)}
        />
        {pushOn ? (
          <Row icon={MessageCircle} title="বার্তা ও নোটিশের পুশ" text="নতুন বার্তা, গ্রুপ বা নোটিশ এলে ফোনে জানাবে" checked={settings.pushMessages} onChange={(pushMessages) => update({ pushMessages })} />
        ) : null}
        <Row icon={MonitorSmartphone} title="নামাজের সময় পূর্ণ-স্ক্রিন রিমাইন্ডার" text="প্রতি ওয়াক্ত শুরু হলে পুরো স্ক্রিনজুড়ে মনে করিয়ে দেবে" checked={settings.waqt} onChange={(waqt) => update({ waqt })} />
        <Row icon={ShieldAlert} title="নিষিদ্ধ সময়ের রিমাইন্ডার" text="সূর্যোদয়, দ্বিপ্রহর ও সূর্যাস্তের নিষিদ্ধ সময় শুরু হলে" checked={settings.forbidden} onChange={(forbidden) => update({ forbidden })} />
        <Row
          icon={BellRing}
          title="ব্রাউজার নোটিফিকেশন"
          text={supported ? "সাইট খোলা থাকলে অন্য ট্যাবে থাকলেও নোটিফিকেশন আসবে" : "এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়"}
          checked={settings.notify}
          onChange={(value) => void toggleNotify(value)}
        />
      </div>
      <p className="mt-3 flex gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        পুশ চালু থাকলে ওয়াক্ত ও নিষিদ্ধ সময়ের সূচনায় আপনার বেছে নেওয়া শহরের সময় অনুযায়ী ফোনে নোটিফিকেশন আসে। আইফোনে (iOS ১৬.৪+) সাইটটি আগে “হোম স্ক্রিনে যোগ করুন” দিয়ে অ্যাপ হিসেবে খুলতে হবে। নিচের দুটি সুইচ পূর্ণ-স্ক্রিন রিমাইন্ডার ও পুশ — দুটোকেই নিয়ন্ত্রণ করে।
      </p>
    </section>
  );
}
