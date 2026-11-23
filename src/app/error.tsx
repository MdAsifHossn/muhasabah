"use client";

import Link from "next/link";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-sm">
        <h1 className="text-xl font-bold">কিছু একটা সমস্যা হয়েছে</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">দয়া করে আবার চেষ্টা করুন। সমস্যা থাকলে একটু পরে আসুন।</p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={reset} className="inline-flex h-11 items-center rounded-xl bg-active px-5 text-sm font-semibold text-on-active shadow-sm">আবার চেষ্টা করুন</button>
          <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-hairline px-5 text-sm font-semibold">মূল পাতা</Link>
        </div>
      </div>
    </main>
  );
}
