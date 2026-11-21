import { SiteHeader } from "@/components/layout/site-header";

/** Public calendar — open to everyone, same top bar as the landing page. */
export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pt-6">{children}</main>
    </div>
  );
}
