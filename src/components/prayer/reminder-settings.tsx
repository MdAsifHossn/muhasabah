"use client";

import { BellRing, Info, MonitorSmartphone, ShieldAlert } from "lucide-react";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { useReminderSettings } from "@/components/prayer/reminder-store";
import { Switch } from "@/components/ui/switch";

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
        সাইট খোলা থাকলেই রিমাইন্ডার কাজ করে। সাইট পুরো বন্ধ থাকলেও ফোনে অ্যালার্মের মতো জানাতে হলে পুশ নোটিফিকেশন লাগবে — সেটি পরের ধাপে যোগ করা যাবে।
      </p>
    </section>
  );
}
