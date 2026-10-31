import type { Metadata } from "next";

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
      />
      <PrayerTimeline minutes={timings.minutes} />
      <ReminderSettingsCard />
      {timings.source === "fallback" ? <p className="text-xs text-muted-foreground">লাইভ সময় পাওয়া যায়নি — আনুমানিক সময় দেখানো হচ্ছে।</p> : null}
    </div>
  );
}
