import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  CalendarDays,
  Flame,
  Library,
  NotebookPen,
  ClipboardCheck,
  MoonStar,
  UsersRound,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/layout/site-header";
import { GuidanceCarousel } from "@/components/guidance-carousel";
import { TodayPrayerCard } from "@/components/today-prayer-card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  formatBanglaDate,
  formatEnglishDate,
  formatHijriDate,
} from "@/lib/dates";
import { getDailyGuidance } from "@/lib/islamic-content";
import { getTodayFastingInfo } from "@/lib/prayer-times";

const features = [
  {
    icon: ClipboardCheck,
    title: "দৈনিক আমলনামা",
    text: "প্রতিদিনের আমলের হিসাব",
    tone: "bg-cat-salah/12 text-cat-salah",
  },
  {
    icon: MoonStar,
    title: "ভাই ও বোনদের আলাদা",
    text: "যার যার উপযোগী আমল",
    tone: "bg-cat-character/12 text-cat-character",
  },
  {
    icon: BookOpenCheck,
    title: "আল-কুরআন",
    text: "অর্থ ও তিলাওয়াতসহ",
    tone: "bg-cat-quran/12 text-cat-quran",
  },
  {
    icon: BookMarked,
    title: "হাদীস",
    text: "প্রসিদ্ধ গ্রন্থসমূহ",
    tone: "bg-cat-dhikr/12 text-cat-dhikr",
  },
  {
    icon: UsersRound,
    title: "উস্তাদজির তত্ত্বাবধান",
    text: "পরামর্শ ও পর্যালোচনা",
    tone: "bg-cat-jumuah/14 text-cat-jumuah",
  },
  {
    icon: BarChart3,
    title: "অগ্রগতি",
    text: "দিনভিত্তিক গ্রিড ও রিপোর্ট",
    tone: "bg-cat-sunnah/12 text-cat-sunnah",
  },
];

const steps = [
  {
    icon: NotebookPen,
    title: "প্রতিদিন আমলনামা লিখুন",
    text: "নামাজ, কুরআন, যিকির, আখলাক — দিনের শেষে দুই মিনিটে নিজের হিসাব।",
  },
  {
    icon: Flame,
    title: "ধারাবাহিকতা গড়ুন",
    text: "পাঁচ ওয়াক্তে তাকবীরে উলা টানা কত দিন — আপনার সেরা আমল হিসেবে চোখের সামনে।",
  },
  {
    icon: UsersRound,
    title: "উস্তাদজির পরামর্শ নিন",
    text: "উস্তাদজি আমলনামা দেখে উৎসাহ ও সংশোধনের নসীহত দেন।",
  },
];

/** Gold rule with an ৮-কোণা তারা in the middle. */
function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-current sm:w-28" />
      <svg viewBox="0 0 24 24" className="size-5">
        <g fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
          <rect x="6" y="6" width="12" height="12" rx="0.6" />
          <rect x="6" y="6" width="12" height="12" rx="0.6" transform="rotate(45 12 12)" />
        </g>
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-current sm:w-28" />
    </div>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; next?: string }>;
}) {
  const params = await searchParams;
  // Old links used `/?auth=login` — the login screen now lives at /login.
  if (params.auth)
    redirect(
      params.next ? `/login?next=${encodeURIComponent(params.next)}` : "/login",
    );

  const session = await auth.api.getSession({ headers: await headers() });
  const [timings, guidance] = await Promise.all([
    getTodayFastingInfo(),
    getDailyGuidance(),
  ]);
  const today = new Date();
  const appHref = session ? "/dashboard" : "/login";
  const hadithHref = session
    ? "/dashboard/hadith"
    : "/login?next=/dashboard/hadith";

  return (
    <main className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <SiteHeader />

      {/* ── Hero ── */}
      {/* The teal banner background spans the whole hero; compact text so the prayer card is visible on phones. */}
      <section className="hero-surface">
        {/* Bottom fade: the teal pattern melts into the page background instead of ending in a hard edge. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-background sm:h-40" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-5 px-3 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:items-center lg:gap-10 lg:pb-14 lg:pt-14 [&>*]:min-w-0">
          <div className="text-center lg:text-left">
            <p dir="rtl" className="quran-text text-xl text-marble-200 sm:text-2xl lg:text-left">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <h1 className="mt-1 text-[1.75rem] font-bold leading-[1.25] sm:text-5xl">
              হিসাব দিনের আগে <span className="text-gradient-gold sm:block">নিজের হিসাব নিন</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-hero-muted sm:text-lg sm:leading-7 lg:mx-0">
              প্রতিদিনের আমলনামা, তাকবীরে উলার ধারাবাহিকতা, আল-কুরআন ও হাদীস — উস্তাদজির তত্ত্বাবধানে।
            </p>
            <div className="mx-auto mt-5 flex max-w-md gap-2 sm:gap-3 lg:mx-0">
              <Button asChild size="lg" className="min-w-0 flex-[1.4] gap-1.5 rounded-[10px] bg-[#f4f1ea] px-3 text-[#0b3b40] hover:bg-[#e9e4d8] sm:flex-none sm:px-6">
                <Link href={session ? "/dashboard/amalnama" : "/login"}>
                  {session ? "আজকের আমলনামা" : "প্রবেশ করুন"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="hero" className="min-w-0 flex-1 gap-1.5 rounded-[10px] px-2.5 sm:flex-none sm:px-6">
                <Link href="/quran">
                  <BookOpenCheck className="size-4" /> কুরআন পড়ুন
                </Link>
              </Button>
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

      {/* ── Quick access (public) ── */}
      <section className="mx-auto max-w-6xl px-3 pt-4 sm:px-6 sm:pt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/quran",
              icon: BookOpenCheck,
              title: "আল-কুরআন",
              text: "অর্থ ও তিলাওয়াতসহ পড়ুন",
              tone: "bg-cat-quran/12 text-cat-quran",
            },
            {
              href: hadithHref,
              icon: BookMarked,
              title: "হাদীস",
              text: "বুখারী, মুসলিমসহ প্রসিদ্ধ গ্রন্থ",
              tone: "bg-cat-dhikr/12 text-cat-dhikr",
            },
            {
              href: "/library",
              icon: Library,
              title: "কিতাবখানা",
              text: "৫৬০+ বাংলা ইসলামি বই",
              tone: "bg-cat-reading/12 text-cat-reading",
            },
            {
              href: "/calendar",
              icon: CalendarDays,
              title: "হিজরি ক্যালেন্ডার",
              text: formatHijriDate(today),
              tone: "bg-cat-jumuah/14 text-cat-jumuah",
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="surface group flex items-center gap-4 rounded-card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-2xl ${item.tone}`}
              >
                <item.icon className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{item.title}</span>
                <span className="block truncate text-sm text-muted-foreground">
                  {item.text}
                </span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-subtle-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Daily guidance ── */}
      <section
        id="guidance"
        className="mx-auto max-w-6xl px-3 pt-8 sm:px-6 sm:pt-12"
      >
        <GuidanceCarousel
          quranPages={guidance.quranPages}
          hadiths={guidance.hadiths}
        />
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-6xl px-3 pt-12 sm:px-6 sm:pt-20">
        <Ornament />
        <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">যেভাবে মুহাসাবাহ সাহায্য করে</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-6 text-muted-foreground sm:text-base">
          উমর (রা.)-এর নসীহত মনে রেখে — প্রতিদিন নিজের আমলের হিসাব নেওয়ার একটি সহজ অভ্যাস।
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
          {steps.map((step, index) => (
            <li key={step.title} className="surface relative overflow-hidden rounded-card p-5">
              <span className="absolute -top-4 right-2 text-7xl font-extrabold text-primary/[0.07]" aria-hidden>
                {["১", "২", "৩"][index]}
              </span>
              <span className={index === 1 ? "streak-surface grid size-12 place-items-center rounded-2xl text-white" : "grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"}>
                <step.icon className="size-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-3 py-12 sm:px-6 sm:py-20">
        <Ornament />
        <h2 className="mt-3 text-center text-2xl font-bold sm:text-3xl">
          এক জায়গায় দ্বীনি রুটিন
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="surface rounded-card p-4 sm:p-5"
            >
              <span
                className={`grid size-11 place-items-center rounded-xl ${feature.tone}`}
              >
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug sm:text-lg">
                {feature.title}
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm">
                {feature.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-3 py-12 sm:px-6 sm:py-20">
        <div className="hero-surface flex flex-col items-start gap-5 rounded-[1.75rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              প্রতিদিন একটু একটু করে
            </h2>
            <p className="mt-2 text-on-hero-muted">
              নিয়মিত ছোট আমলই ইনশাআল্লাহ বড় পরিবর্তনের পথ তৈরি করে।
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="w-full bg-[#f4f1ea] text-[#0b3b40] hover:bg-[#e9e4d8] sm:w-auto"
          >
            <Link href={appHref}>
              {session ? "ড্যাশবোর্ড" : "প্রবেশ / নিবন্ধন"}{" "}
              <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Brand />
          <div className="sm:text-right">
            <p>মুহাসাবাহ • প্রতিদিনের আত্মপর্যালোচনা ও আমলের সঙ্গী</p>
            <p className="mt-1 text-xs font-semibold text-primary">
              Developed by{" "}
              <a
                href="https://getasif.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-primary/40 underline-offset-4 transition hover:text-primary-hover"
              >
                Md. Asif Hossain
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
