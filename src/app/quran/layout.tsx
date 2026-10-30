import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "আল-কুরআন",
  description: "পবিত্র কুরআন — উসমানী আরবি, বাংলা অর্থ ও তিলাওয়াতসহ। লগইন ছাড়াই পড়ুন।",
};

/** Full-screen public Quran (outside the dashboard shell); the page owns its chrome. */
export default function QuranLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
