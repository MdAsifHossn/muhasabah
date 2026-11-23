import {
  AlarmClock,
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  LayoutGrid,
  Library,
  MessagesSquare,
  ScrollText,
  Sparkles,
  UsersRound,
  WifiOff,
  type LucideIcon,
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

const TILE_TONES: Record<string, { card: string; icon: string }> = {
  "text-cat-salah": { card: "from-cat-salah/14 hover:border-cat-salah/50", icon: "bg-cat-salah/15 text-cat-salah ring-cat-salah/25" },
  "text-cat-discipline": { card: "from-cat-discipline/14 hover:border-cat-discipline/50", icon: "bg-cat-discipline/15 text-cat-discipline ring-cat-discipline/25" },
  "text-cat-sunnah": { card: "from-cat-sunnah/14 hover:border-cat-sunnah/50", icon: "bg-cat-sunnah/15 text-cat-sunnah ring-cat-sunnah/25" },
  "text-cat-service": { card: "from-cat-service/14 hover:border-cat-service/50", icon: "bg-cat-service/15 text-cat-service ring-cat-service/25" },
  "text-cat-character": { card: "from-cat-character/14 hover:border-cat-character/50", icon: "bg-cat-character/15 text-cat-character ring-cat-character/25" },
  "text-cat-quran": { card: "from-cat-quran/14 hover:border-cat-quran/50", icon: "bg-cat-quran/15 text-cat-quran ring-cat-quran/25" },
  "text-cat-dhikr": { card: "from-cat-dhikr/14 hover:border-cat-dhikr/50", icon: "bg-cat-dhikr/15 text-cat-dhikr ring-cat-dhikr/25" },
  "text-cat-reading": { card: "from-cat-reading/14 hover:border-cat-reading/50", icon: "bg-cat-reading/15 text-cat-reading ring-cat-reading/25" },
  "text-warning": { card: "from-warning/14 hover:border-warning/50", icon: "bg-warning/15 text-warning ring-warning/25" },
  "text-info": { card: "from-info/14 hover:border-info/50", icon: "bg-info/15 text-info ring-info/25" },
};

type QuickItem = { href: string; icon: LucideIcon; title: string; text: string; tone: string };
type QuickGroup = { title: string; items: QuickItem[] };

/** Every feature of the site as one tap-able card. `needsLogin` routes sit behind the sign-in wall. */
function buildQuickGroups(signedIn: boolean, hijri: string): QuickGroup[] {
  const gated = (path: string) => (signedIn ? path : `/login?next=${path}`);
  return [
    {
      title: "প্রতিদিনের আমল",
      items: [
        { href: gated("/dashboard/amalnama"), icon: ClipboardCheck, title: "আজকের আমল", text: "দিনের হিসাব লিখুন", tone: "bg-cat-salah/14 text-cat-salah" },
        { href: gated("/dashboard/amalnama/grid"), icon: LayoutGrid, title: "আমলের খাতা", text: "দিনভিত্তিক গ্রিড", tone: "bg-cat-discipline/14 text-cat-discipline" },
        { href: gated("/dashboard/progress"), icon: BarChart3, title: "আমার উন্নতি", text: "ধারাবাহিকতা ও রিপোর্ট", tone: "bg-cat-sunnah/14 text-cat-sunnah" },
        { href: gated("/dashboard/prayer"), icon: AlarmClock, title: "নামাজের সময়", text: "ওয়াক্ত ও রিমাইন্ডার", tone: "bg-cat-service/14 text-cat-service" },
        { href: gated("/dashboard/messages"), icon: MessagesSquare, title: "উস্তাদজি", text: "বার্তা, নোটিশ ও মতামত", tone: "bg-cat-character/14 text-cat-character" },
      ],
    },
    {
      title: "কুরআন ও হাদীস",
      items: [
        { href: "/quran", icon: BookOpenCheck, title: "আল-কুরআন", text: "অর্থ ও তিলাওয়াতসহ", tone: "bg-cat-quran/14 text-cat-quran" },
        { href: gated("/dashboard/hadith"), icon: BookMarked, title: "হাদীস", text: "বুখারী, মুসলিমসহ প্রসিদ্ধ গ্রন্থ", tone: "bg-cat-dhikr/14 text-cat-dhikr" },
        { href: gated("/dashboard/offline"), icon: WifiOff, title: "নেট ছাড়া কুরআন", text: "অফলাইনে পড়ুন", tone: "bg-cat-reading/14 text-cat-reading" },
        { href: "/library", icon: Library, title: "কিতাবখানা", text: "৫৬০+ বাংলা ইসলামি বই", tone: "bg-warning/14 text-warning" },
      ],
    },
    {
      title: "দোয়া, জ্ঞান ও সময়",
      items: [
        { href: "/names-of-allah", icon: Sparkles, title: "আল্লাহর ৯৯ নাম", text: "অর্থ ও তাৎপর্যসহ", tone: "bg-warning/14 text-warning" },
        { href: "/prayer/duas", icon: ScrollText, title: "নামাজের দু'আ", text: "তাকবীর থেকে সালাম", tone: "bg-cat-salah/14 text-cat-salah" },
        { href: "/dua", icon: BookOpen, title: "দোয়া ও যিকির", text: "হিসনুল মুসলিম ও কুরআনের দোয়া", tone: "bg-cat-dhikr/14 text-cat-dhikr" },
        { href: "/mahram", icon: UsersRound, title: "মাহরাম তালিকা", text: "পুরুষ ও নারীর জন্য", tone: "bg-cat-character/14 text-cat-character" },
        { href: "/calendar", icon: CalendarDays, title: "ক্যালেন্ডার", text: hijri, tone: "bg-info/14 text-info" },
      ],
    },
  ];
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
  const quickGroups = buildQuickGroups(Boolean(session), formatHijriDate(today));

  return (
    <main className="landing-canvas min-h-dvh overflow-x-clip text-foreground">
      <SiteHeader />

      {/* ── Hero ── */}
      {/* The teal banner background spans the whole hero; compact text so the prayer card is visible on phones. */}
      <section className="hero-surface">
        {/* Bottom fade: the teal pattern melts into the page background instead of ending in a hard edge. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-background sm:h-40" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-5 px-3 pb-10 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:items-center lg:gap-10 lg:pb-14 lg:pt-14 [&>*]:min-w-0">
          <div className="text-center lg:text-left">
            <p dir="rtl" className="quran-text mb-3 text-xl text-marble-200 sm:mb-4 sm:text-2xl lg:mb-6 lg:text-left lg:text-3xl">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <h1 className="mt-1 text-[1.75rem] font-bold leading-[1.25] sm:text-5xl lg:text-[3.5rem] lg:leading-[1.2]">
              হিসাব দিনের আগে <span className="text-gradient-gold sm:block">নিজের হিসাব নিন</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-hero-muted sm:text-lg sm:leading-7 lg:mx-0 lg:mt-5 lg:max-w-lg lg:text-xl lg:leading-8">
              প্রতিদিনের আমলনামা, তাকবীরে উলার ধারাবাহিকতা, আল-কুরআন ও হাদীস — উস্তাদজির তত্ত্বাবধানে।
            </p>
            <div className="mx-auto mt-5 flex max-w-md gap-2 sm:gap-3 lg:mx-0 lg:mt-8">
              <Button asChild size="lg" variant="cta" className="min-w-0 flex-[1.4] gap-1.5 rounded-[10px] px-3 sm:flex-none sm:px-6">
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

      {/* ── Shortcuts: every feature one tap away ── */}
      <section id="features" aria-label="দ্রুত প্রবেশ" className="mx-auto max-w-6xl px-3 pt-6 sm:px-6 sm:pt-10">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {quickGroups.flatMap((group) => group.items).map((item) => {
            const tile = TILE_TONES[item.tone.split(" ").find((c) => c.startsWith("text-")) ?? ""] ?? TILE_TONES["text-cat-salah"];
            return (
              <Link
                key={item.title}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border border-hairline bg-linear-to-br via-card to-card p-3 pr-2.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-3.5 ${tile.card}`}
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 sm:size-10 ${tile.icon}`}>
                  <item.icon className="size-[18px] sm:size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold leading-tight text-foreground sm:text-sm">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted-foreground sm:text-xs">{item.text}</span>
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-subtle-foreground opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100 max-sm:hidden" />
              </Link>
            );
          })}
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

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-3 py-12 sm:px-6 sm:py-20">
        <div className="hero-surface flex flex-col items-start gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
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
            variant="cta"
            className="w-full sm:w-auto"
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
