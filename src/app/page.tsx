import {
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  Megaphone,
  MoonStar,
  ShieldCheck,
  UsersRound,
  WifiOff,
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
import { formatBanglaDate, formatEnglishDate, formatHijriDate } from "@/lib/dates";
import { getDailyGuidance } from "@/lib/islamic-content";
import { getTodayFastingInfo } from "@/lib/prayer-times";

const features = [
  { icon: ClipboardCheck, title: "দৈনিক আমলনামা", text: "প্রতিদিনের আমলের হিসাব", tone: "bg-cat-salah/12 text-cat-salah" },
  { icon: MoonStar, title: "ভাই ও বোনদের আলাদা", text: "যার যার উপযোগী আমল", tone: "bg-cat-character/12 text-cat-character" },
  { icon: BookOpenCheck, title: "আল-কুরআন", text: "অর্থ ও তিলাওয়াতসহ", tone: "bg-cat-quran/12 text-cat-quran" },
  { icon: BookMarked, title: "হাদীস", text: "প্রসিদ্ধ গ্রন্থসমূহ", tone: "bg-cat-dhikr/12 text-cat-dhikr" },
  { icon: UsersRound, title: "উস্তাদজির তত্ত্বাবধান", text: "পরামর্শ ও পর্যালোচনা", tone: "bg-cat-jumuah/14 text-cat-jumuah" },
  { icon: BarChart3, title: "অগ্রগতি", text: "৭ / ৩০ / ৪০ দিনের রিপোর্ট", tone: "bg-cat-sunnah/12 text-cat-sunnah" },
];

const roles = [
  { icon: ClipboardCheck, title: "সদস্য", text: "নিজের আমলনামা, কুরআন, হাদীস, বই ও অগ্রগতি।" },
  { icon: UsersRound, title: "উস্তাদজি", text: "সদস্যদের আমলনামা দেখা, মন্তব্য, রিভিউ, নোটিশ ও আমল তালিকা।" },
  { icon: ShieldCheck, title: "অ্যাডমিন", text: "ব্যবহারকারী, রোল, পাসওয়ার্ড, সাইকেল ও পুরো সিস্টেম।" },
];

export default async function HomePage({ searchParams }: { searchParams: Promise<{ auth?: string; next?: string }> }) {
  const params = await searchParams;
  // Old links used `/?auth=login` — the login screen now lives at /login.
  if (params.auth) redirect(params.next ? `/login?next=${encodeURIComponent(params.next)}` : "/login");

  const session = await auth.api.getSession({ headers: await headers() });
  const [timings, guidance] = await Promise.all([getTodayFastingInfo(), getDailyGuidance()]);
  const today = new Date();
  const appHref = session ? "/dashboard" : "/login";
  const hadithHref = session ? "/dashboard/hadith" : "/login?next=/dashboard/hadith";

  return (
    <main className="min-h-dvh overflow-x-clip bg-background text-foreground">
      <SiteHeader />

      {/* ── Hero ── */}
      <section className="pattern-canvas">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-10 lg:pb-16">
          <div className="hero-surface relative overflow-hidden rounded-[1.75rem] px-5 py-8 sm:px-10 sm:py-12">
            <p dir="rtl" className="quran-text inline-block rounded-full bg-white/10 px-4 py-1 text-xl text-amber-200 ring-1 ring-white/15 sm:text-2xl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <h1 className="mt-6 text-[2rem] font-bold leading-[1.2] sm:text-5xl">
              নিজের আমলের হিসাব
              <span className="block text-emerald-300">প্রতিদিন, নিয়মিত।</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-on-hero-muted sm:text-lg">
              আমলনামা, আল-কুরআন ও হাদীস — উস্তাদজির তত্ত্বাবধানে।
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-[#e3b25a] text-[#2a1d02] hover:bg-[#ecc272]">
                <Link href={session ? "/dashboard/amalnama" : "/login"}>
                  {session ? "আজকের আমলনামা" : "প্রবেশ করুন"}
                  <ArrowRight className="size-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="hero">
                <Link href="/quran">
                  <BookOpenCheck className="size-5" /> কুরআন পড়ুন
                </Link>
              </Button>
            </div>
          </div>
          <TodayPrayerCard timings={timings} hijriDate={formatHijriDate(today)} banglaDate={formatBanglaDate(today)} englishDate={formatEnglishDate(today)} />
        </div>
      </section>

      {/* ── Quick access (public) ── */}
      <section className="mx-auto max-w-6xl px-4 pt-2 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: "/quran", icon: BookOpenCheck, title: "আল-কুরআন", text: "অর্থ ও তিলাওয়াতসহ পড়ুন", tone: "bg-cat-quran/12 text-cat-quran" },
            { href: hadithHref, icon: BookMarked, title: "হাদীস", text: "বুখারী, মুসলিমসহ প্রসিদ্ধ গ্রন্থ", tone: "bg-cat-dhikr/12 text-cat-dhikr" },
            { href: "/calendar", icon: CalendarDays, title: "হিজরি ক্যালেন্ডার", text: formatHijriDate(today), tone: "bg-cat-jumuah/14 text-cat-jumuah" },
          ].map((item) => (
            <Link key={item.title} href={item.href} className="surface group flex items-center gap-4 rounded-card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${item.tone}`}>
                <item.icon className="size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{item.title}</span>
                <span className="block truncate text-sm text-muted-foreground">{item.text}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-subtle-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <h2 className="text-xl font-bold sm:text-3xl">এক জায়গায় দ্বীনি রুটিন</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="surface rounded-card p-4 sm:p-5">
              <span className={`grid size-11 place-items-center rounded-xl ${feature.tone}`}>
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug sm:text-lg">{feature.title}</h3>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground sm:text-sm">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Daily guidance ── */}
      <section id="guidance" className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 sm:pb-16">
        <GuidanceCarousel quranPages={guidance.quranPages} hadiths={guidance.hadiths} />
      </section>

      {/* ── Roles ── */}
      <section className="border-y border-hairline bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">তিন ধরনের ব্যবহারকারী</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {roles.map((role) => (
              <div key={role.title} className="rounded-card border border-hairline bg-background p-5">
                <role.icon className="size-6 text-primary" />
                <h3 className="mt-3 font-bold">{role.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{role.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5"><WifiOff className="size-3.5" /> অফলাইনে কুরআন</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5"><Megaphone className="size-3.5" /> নোটিশ বোর্ড</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5"><ShieldCheck className="size-3.5" /> প্রাইভেসি নিয়ন্ত্রণ</span>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="hero-surface flex flex-col items-start gap-5 rounded-[1.75rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">প্রতিদিন একটু একটু করে</h2>
            <p className="mt-2 text-on-hero-muted">নিয়মিত ছোট আমলই ইনশাআল্লাহ বড় পরিবর্তনের পথ তৈরি করে।</p>
          </div>
          <Button asChild size="lg" className="w-full bg-[#e3b25a] text-[#2a1d02] hover:bg-[#ecc272] sm:w-auto">
            <Link href={appHref}>
              {session ? "ড্যাশবোর্ড" : "প্রবেশ / নিবন্ধন"} <ArrowRight className="size-5" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Brand />
          <div className="sm:text-right">
            <p>মুহাসাবাহ • প্রতিদিনের আত্মপর্যালোচনা ও আমলের সঙ্গী</p>
            <p className="mt-1 text-xs font-semibold text-primary">Developed by Md. Asif Hossain</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
