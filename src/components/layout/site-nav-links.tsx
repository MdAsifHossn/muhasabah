"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/** Desktop links on public pages; the current page is highlighted. */
export function SiteNavLinks({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const links = [
    { label: "কুরআন", href: "/quran" },
    { label: "হাদীস", href: signedIn ? "/dashboard/hadith" : "/login?next=/dashboard/hadith" },
    { label: "আল্লাহর ৯৯ নাম", href: "/names-of-allah" },
    { label: "দোয়া ও যিকির", href: "/dua" },
  ];
  const moreLinks = [
    { label: "নামাজের ১৪ ধাপ", href: "/prayer/duas" },
    { label: "মাহরাম তালিকা", href: "/mahram" },
    { label: "কিতাবখানা", href: "/library" },
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
      <DropdownMenu>
        <DropdownMenuTrigger className={cn("flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold", moreLinks.some((link) => pathname === link.href || pathname.startsWith(`${link.href}/`)) ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground hover:bg-accent")}>
          আরও <ChevronDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">{moreLinks.map((link) => <DropdownMenuItem key={link.href} asChild className="h-10 rounded-lg"><Link href={link.href} aria-current={pathname === link.href ? "page" : undefined}>{link.label}</Link></DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
