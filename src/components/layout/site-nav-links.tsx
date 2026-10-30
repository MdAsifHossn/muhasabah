"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/** Desktop links on public pages; the current page is highlighted. */
export function SiteNavLinks({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const links = [
    { label: "কুরআন", href: "/quran" },
    { label: "হাদীস", href: signedIn ? "/dashboard/hadith" : "/login?next=/dashboard/hadith" },
    { label: "হিজরি ক্যালেন্ডার", href: "/calendar" },
  ];
  return (
    <nav aria-label="সাইট নেভিগেশন" className="hidden items-center gap-1 lg:flex">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold transition",
              active ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
