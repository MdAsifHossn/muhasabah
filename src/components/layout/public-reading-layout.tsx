import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";

export function PublicReadingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background"><SiteHeader /><main className="mx-auto w-full max-w-5xl px-3 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6">{children}</main></div>;
}
