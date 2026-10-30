import type { Metadata } from "next";
import { headers } from "next/headers";

import { QuranHome } from "@/components/quran/quran-home";
import { QuranReader } from "@/components/quran/reader";
import { auth } from "@/lib/auth";
import { shortBanglaName, SURAH_LIST } from "@/lib/quran";
import { toIntInRange } from "@/lib/quran-progress";

type Search = Promise<{ surah?: string; juz?: string; ayah?: string; s?: string; mode?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const params = await searchParams;
  const surah = toIntInRange(params.surah, 1, 114);
  const juz = toIntInRange(params.juz, 1, 30);
  if (surah) return { title: `সূরা ${shortBanglaName(SURAH_LIST[surah - 1])}` };
  if (juz) return { title: `পারা ${juz}` };
  return { title: "আল-কুরআন" };
}

/**
 * Public Quran — no login required.
 *   /quran                     → surah / para list + continue reading
 *   /quran?surah=36&ayah=12    → reader, scrolled to the ayah
 *   /quran?juz=30              → para reader
 * The session is only observed: logged-in members also sync progress.
 */
export default async function QuranPage({ searchParams }: { searchParams: Search }) {
  const [params, session] = await Promise.all([searchParams, auth.api.getSession({ headers: await headers() })]);
  const isLoggedIn = Boolean(session?.user && session.user.isActive);

  const surah = toIntInRange(params.surah, 1, 114);
  const juz = toIntInRange(params.juz, 1, 30);
  const ayah = toIntInRange(params.ayah, 1, 286) ?? undefined;

  if (juz && !surah) {
    return <QuranReader key={`juz-${juz}`} mode="juz" id={juz} initialSurah={toIntInRange(params.s, 1, 114) ?? undefined} initialAyah={ayah} isLoggedIn={isLoggedIn} />;
  }
  if (surah) {
    return <QuranReader key={`surah-${surah}`} mode="surah" id={surah} initialAyah={ayah} isLoggedIn={isLoggedIn} />;
  }
  return <QuranHome isLoggedIn={isLoggedIn} />;
}
