import { headers } from "next/headers";

import { QuranReader } from "@/components/quran/reader";
import { auth } from "@/lib/auth";

/**
 * Public Quran reader — reachable by ANYONE, no authentication required.
 *
 * The session is only *observed* here (never enforced): `isLoggedIn` decides
 * whether the optional progress features are on. Guests get the full reader
 * (browsing, audio, view modes, font size, sheets, desktop sidebar, mobile
 * bottom bar) but never touch `/api/quran/progress`, so there are no 401s and
 * nothing to resume.
 */
export default async function QuranPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = Boolean(session?.user && session.user.isActive);
  return <QuranReader isLoggedIn={isLoggedIn} />;
}
