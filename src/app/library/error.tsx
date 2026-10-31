"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** Upstream (IslamHouse) unreachable or slow — friendly message + retry. */
export default function LibraryError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="surface mx-auto mt-6 max-w-md rounded-card px-6 py-10 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-warning-soft text-warning">
        <WifiOff className="size-6" />
      </span>
      <h1 className="mt-4 text-lg font-bold text-foreground">বইয়ের তালিকা আনা যায়নি</h1>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">বইয়ের উৎস (IslamHouse.com) এই মুহূর্তে সাড়া দিচ্ছে না। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</p>
      <div className="mt-5 flex justify-center gap-2">
        <Button onClick={reset}>
          <RefreshCw className="size-4" /> আবার চেষ্টা করুন
        </Button>
        <Button asChild variant="outline">
          <Link href="/">হোমে যান</Link>
        </Button>
      </div>
    </div>
  );
}
