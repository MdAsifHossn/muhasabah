"use client";

import { RotateCw, WifiOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HadithSectionError({ retry, reset }: { error: Error & { digest?: string }; retry?: () => void; reset?: () => void }) {
  return (
    <div className="surface mx-auto max-w-xl rounded-card px-5 py-10 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-warning-soft text-warning">
        <WifiOff className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-foreground">হাদীস লোড করা যায়নি</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={() => (retry ?? reset)?.()}>
          <RotateCw className="size-4" /> আবার চেষ্টা করুন
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/hadith">লাইব্রেরি</Link>
        </Button>
      </div>
    </div>
  );
}
