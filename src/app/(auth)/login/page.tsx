import { BookMarked, BookOpenText, ClipboardCheck, UsersRound } from "lucide-react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { BrandMark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "প্রবেশ" };

const points = [
  { icon: ClipboardCheck, title: "দৈনিক আমলনামা", text: "নামাজ, তিলাওয়াত, যিকির — প্রতিদিনের হিসাব" },
  { icon: BookOpenText, title: "আল-কুরআন", text: "অর্থ ও তিলাওয়াতসহ" },
  { icon: BookMarked, title: "হাদীস", text: "প্রসিদ্ধ গ্রন্থসমূহ বাংলায়" },
  { icon: UsersRound, title: "উস্তাদজির তত্ত্বাবধান", text: "পরামর্শ ও নিয়মিত পর্যালোচনা" },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.isActive) redirect("/dashboard");
  const { mode } = await searchParams;

  return (
    <main className="hero-surface flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:pt-8">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark className="ring-white/20" />
          <span className="text-lg font-bold">মুহাসাবাহ</span>
        </Link>
        <ThemeToggle className="border-white/20 bg-white/10 text-on-hero hover:text-white" />
      </header>

      <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-8 px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:grid-cols-[1fr_440px] lg:gap-14 lg:py-10">
        {/* ── Story ── */}
        <section className="text-center lg:text-left">
          <p dir="rtl" className="quran-text text-gradient-gold text-[1.9rem] leading-[1.8] lg:text-[2.5rem]">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
          <h1 className="mt-2 text-[1.6rem] font-bold leading-snug lg:mt-4 lg:text-[2.4rem] lg:leading-tight">
            হিসাব দিনের আগে
            <br className="hidden lg:block" /> নিজের হিসাব নিন
          </h1>
          <ul className="mt-8 hidden gap-3 lg:grid">
            {points.map((point) => (
              <li key={point.title} className="flex items-center gap-4 rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-white/10 backdrop-blur-sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-[#f0cf8c]">
                  <point.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{point.title}</span>
                  <span className="block text-sm text-on-hero-muted">{point.text}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-8 hidden text-sm text-on-hero-muted lg:block">“তোমাদের হিসাব নেওয়ার আগে নিজেরাই নিজেদের হিসাব নাও।” — উমর ইবনুল খাত্তাব (রা.)</p>
        </section>

        {/* ── Form card ── */}
        <section className="w-full rounded-[1.5rem] border bg-card p-5 text-card-foreground shadow-xl sm:p-7">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">আসসালামু আলাইকুম</h2>
            <p className="mt-1 text-[15px] text-muted-foreground">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
          </div>
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}>
            <AuthCard initialMode={mode === "register" ? "register" : "login"} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
