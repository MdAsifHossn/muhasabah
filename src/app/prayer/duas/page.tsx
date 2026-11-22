import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/design/page-header";
import { SalatDuasViewer } from "@/components/prayer/salat-duas-viewer";

export const metadata: Metadata = {
  title: "নামাজের প্রয়োজনীয় আরবি ও অর্থ (তাকবীর থেকে সালাম)",
  description: "তাকবীরে তাহরীমা থেকে সালাম পর্যন্ত নামাজে পঠিতব্য সকল আরবি দু'আ, তাসবীহ ও কিরাআতের প্রামাণ্য বাংলা অর্থ।",
};

export default function PublicPrayerDuasPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="সালাত শিক্ষা ও অনুধাবন"
        title="নামাজ"
        description="তাকবীর থেকে সালাম পর্যন্ত প্রতিটি রুকনে পঠিতব্য আয়াত, তাসবীহ ও দু'আর বিশুদ্ধ আরবি পাঠ এবং প্রামাণ্য বাংলা অর্থ (উচ্চারণহীন বিশুদ্ধ সংকলন)।"
      />
      <SalatDuasViewer />
      <Link href="/dua" className="block rounded-2xl border border-primary/20 bg-primary-soft p-4 text-sm font-semibold text-primary">দৈনন্দিন জীবনের আরও দোয়া ও যিকির পড়ুন</Link>
    </div>
  );
}
