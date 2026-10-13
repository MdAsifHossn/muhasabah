import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "আল-কুরআন",
  description: "পবিত্র কুরআন শরীফ — আরবি তিলাওয়াত ও বাংলা অর্থসহ পাঠ।",
};

/**
 * Full-screen wrapper for the PUBLIC Quran reader.
 *
 * No auth here — reading (and listening to) the Quran never requires a login.
 * The session is only read by `page.tsx` to decide whether the OPTIONAL
 * progress features (resume / read-% chip / saved preferences) are enabled.
 *
 * The reader lives OUTSIDE `(shell)`, so there is no sidebar/top bar/bottom
 * nav to compensate for — no negative margins (`-mx-5 -my-8`) or sticky-header
 * offsets are needed. The viewport height is owned here; the page fills it
 * with a fixed header, an internally scrolling reading area and a fixed
 * bottom toolbar that can never overlap the text.
 */
export default function QuranReaderLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-[100dvh] overflow-hidden bg-[#f5f3ed]">{children}</div>;
}
