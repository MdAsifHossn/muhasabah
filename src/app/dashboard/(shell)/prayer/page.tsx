import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ScrollText } from "lucide-react";

import { PageHeader } from "@/components/design/page-header";
import { PrayerTimeline } from "@/components/prayer/prayer-timeline";
import { ReminderSettingsCard } from "@/components/prayer/reminder-settings";
import { formatBanglaDate, formatHijriDate } from "@/lib/dates";
import { getTodayFastingInfo } from "@/lib/prayer-times";

export const metadata: Metadata = { title: "নামাজের সময়" };

export default async function PrayerPage() {
  const timings = await getTodayFastingInfo();
  const today = new Date();
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        eyebrow={`${timings.district} • ${formatHijriDate(today)}`}
        title="নামাজের সময়"
        description={`${formatBanglaDate(today)} — সব ওয়াক্ত, সূর্যোদয়, নিষিদ্ধ সময় ও সেহরি-ইফতার।`}
        actions={
          <Link
            href="/prayer/duas"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary-soft px-3.5 text-xs font-bold text-primary hover:bg-primary-soft/80 transition"
          >
            <ScrollText className="size-4" />
            <span>নামাজের দু&apos;আ ও অর্থ</span>
          </Link>
        }
      />

      <Link
        href="/prayer/duas"
        className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface p-4 shadow-card transition hover:border-primary/50 group"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition-transform">
            <ScrollText className="size-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              নামাজে পঠিতব্য যাবতীয় আরবি ও বাংলা অর্থ
            </h3>
            <p className="text-xs text-muted-foreground">
              তাকবীরে তাহরীমা থেকে সালাম পর্যন্ত প্রতিটি রুকনের বিশুদ্ধ আরবি ও প্রামাণ্য অর্থ
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
      </Link>

      <PrayerTimeline minutes={timings.minutes} />
      <ReminderSettingsCard />
      {timings.source === "fallback" ? <p className="text-xs text-muted-foreground">লাইভ সময় পাওয়া যায়নি — আনুমানিক সময় দেখানো হচ্ছে।</p> : null}
    </div>
  );
}
