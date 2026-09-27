import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { AuthModal } from "@/components/auth/auth-modal";
import { GuidanceCarousel } from "@/components/guidance-carousel";
import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  formatBanglaDate,
  formatEnglishDate,
  formatHijriDate,
} from "@/lib/dates";
import { getGuidanceSlides } from "@/lib/islamic-content";
import { getTodayFastingInfo } from "@/lib/prayer-times";

import { TodayPrayerCard } from "@/components/today-prayer-card";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [timings, guidanceSlides] = await Promise.all([
    getTodayFastingInfo(),
    getGuidanceSlides(),
  ]);
  const today = new Date();
  const appHref = session ? "/dashboard" : "/?auth=login";
  const quranHref = session
    ? "/dashboard/quran"
    : "/?auth=login&next=/dashboard/quran";
  const hadithHref = session
    ? "/dashboard/hadith"
    : "/?auth=login&next=/dashboard/hadith";
  return (
    <main className="min-h-screen overflow-x-clip bg-[#fbfaf6] text-stone-900">
      <header className="sticky top-0 z-[100] border-b border-emerald-950/10 bg-[#fbfaf6]/90 backdrop-blur-xl">
        <div className="mx-auto grid h-18 max-w-[1480px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5 sm:px-8">
          <Brand />
          <p
            dir="rtl"
            className="hidden text-center font-serif text-lg font-bold text-emerald-900 md:block"
          >
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={quranHref}
              className="hidden rounded-full px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 sm:inline-flex"
            >
              কুরআন
            </Link>
            <Link
              href={hadithHref}
              className="hidden rounded-full px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 sm:inline-flex"
            >
              হাদীস
            </Link>
            <Button
              asChild
              className="rounded-full bg-emerald-950 px-4 sm:px-5"
            >
              <Link href={appHref}>
                {session ? "ড্যাশবোর্ড" : "লগইন / নিবন্ধন"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="quiet-grid relative border-b border-[#d7e3d9] bg-[#f4f8f5] text-emerald-950">
        <div className="relative mx-auto grid max-w-[1480px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm">
              নিজের হিসাব নিজে নিন • প্রতিদিন একটু উন্নতি
            </span>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl">
              নিজের আমলের হিসাব{" "}
              <span className="text-emerald-700">
                নিয়মিত ও সুশৃঙ্খলভাবে রাখুন
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">
              দৈনিক আমলনামা পূরণ করুন, ধারাবাহিকতা বুঝুন, কুরআনের তিলাওয়াত শুনুন
              এবং উস্তাদজির পরামর্শে নিজের ঈমানি জীবনকে সুন্দরভাবে গুছিয়ে নিন।
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#176b72] px-7 font-extrabold text-white hover:bg-[#125a60]"
              >
                <Link href={appHref}>
                  {session ? "আজকের আমলনামা" : "বিনামূল্যে শুরু করুন"}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-emerald-300 bg-white/70 px-7 text-emerald-900 hover:bg-emerald-50"
              >
                <Link href={quranHref}>
                  <BookOpenCheck className="size-5" />
                  কুরআন পড়ুন ও শুনুন
                </Link>
              </Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-emerald-800">
              <span className="flex gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                ব্যক্তিগত ও নিরাপদ
              </span>
              <span className="flex gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                বাংলাদেশ সময়
              </span>
              <span className="flex gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                মোবাইল উপযোগী
              </span>
            </div>
          </div>
          <TodayPrayerCard
            timings={timings}
            hijriDate={formatHijriDate(today)}
            banglaDate={formatBanglaDate(today)}
            englishDate={formatEnglishDate(today)}
          />
        </div>
      </section>

      <section
        id="guidance"
        className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8"
      >
        <GuidanceCarousel slides={guidanceSlides} />
      </section>

      <section className="mx-auto max-w-[1480px] px-5 py-20 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            [
              "০১",
              "নিবন্ধন করুন",
              "নাম, ইমেইল ও পাসওয়ার্ড দিয়ে নিজের ব্যক্তিগত account খুলুন।",
            ],
            [
              "০২",
              "আজকের আমল লিখুন",
              "নামাজ, কুরআন, যিকর ও আত্মপর্যালোচনার হিসাব জমা দিন।",
            ],
            [
              "০৩",
              "উন্নতি বুঝুন",
              "history, progress ও উস্তাদজির review থেকে পরবর্তী দিনের লক্ষ্য ঠিক করুন।",
            ],
          ].map(([n, t, d]) => (
            <div key={n} className="rounded-3xl bg-stone-100 p-7">
              <span className="text-4xl font-black text-emerald-200">{n}</span>
              <h3 className="mt-4 text-xl font-black text-emerald-950">{t}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-7 rounded-[2rem] bg-emerald-950 p-8 text-center text-white sm:p-12 lg:flex-row lg:text-left">
          <div>
            <h2 className="text-3xl font-black">
              আজ থেকেই নিজের হিসাব শুরু করুন
            </h2>
            <p className="mt-3 text-emerald-200">
              নিয়মিত ছোট আমলই ইনশাআল্লাহ বড় পরিবর্তনের পথ তৈরি করে।
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="rounded-full bg-sky-100 px-8 font-black text-emerald-950 hover:bg-sky-200"
          >
            <Link href={appHref}>
              {session ? "ড্যাশবোর্ড খুলুন" : "নতুন সদস্য নিবন্ধন"}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </section>
      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-5 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand />
          <div className="text-center sm:text-right">
            <p>মুহাসাবাহ • প্রতিদিনের আত্মপর্যালোচনা ও আমলের সঙ্গী</p>
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              Developed by Md. Asif Hossain
            </p>
          </div>
        </div>
      </footer>
      <Suspense>
        <AuthModal />
      </Suspense>
    </main>
  );
}
