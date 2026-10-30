"use client";

import { RefreshCcw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-card border border-hairline bg-surface p-8 text-center shadow-card">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <TriangleAlert className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold text-foreground">তথ্য দেখানো যাচ্ছে না</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।</p>
      <Button className="mt-5" onClick={reset}>
        <RefreshCcw className="size-4" /> আবার চেষ্টা করুন
      </Button>
    </div>
  );
}
