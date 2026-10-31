"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.origin : "https://muhasabah.app";
    const title = "মুহাসাবাহ — আমল, কুরআন ও হাদীস";
    const text = "মুহাসাবাহ — আত্মশুদ্ধি, আমলনামা ও কুরআন-হাদীস চর্চার আধুনিক মাধ্যম। প্রতিদিনের আমলের হিসাব রাখুন ও নিয়মিত কুরআন-হাদীস পড়ুন।";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if ((error as Error)?.name === "AbortError") {
          return;
        }
      }
    }

    // Fallback: Copy link to clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("মুহাসাবাহ লিংক কপি করা হয়েছে! অন্যকে শেয়ার করুন।");
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error("লিংক কপি করা যায়নি।");
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="শেয়ার করুন"
      title="অ্যাপটি অন্যকে শেয়ার করুন"
      className={cn(
        "grid size-10 place-items-center rounded-xl border bg-card text-muted-foreground shadow-xs transition hover:text-foreground active:scale-95",
        copied && "border-primary text-primary",
        className,
      )}
    >
      {copied ? <Check className="size-[18px] text-primary" /> : <Share2 className="size-[18px]" />}
    </button>
  );
}

