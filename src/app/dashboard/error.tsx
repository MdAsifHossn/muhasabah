"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center"><h2 className="text-xl font-bold text-stone-900">তথ্য দেখানো যাচ্ছে না</h2><p className="mt-2 text-sm text-stone-500">সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p><Button className="mt-5" onClick={reset}>আবার চেষ্টা করুন</Button></div>;
}
