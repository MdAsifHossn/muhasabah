"use client";

import { BookMarked, BookOpen, BookOpenCheck, CalendarDays, Library, Menu, Moon, ScrollText, Sparkles, Sun, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Phone/tablet menu for visitors who are not signed in. */
export function GuestMenu() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="মেনু"
        className="grid size-10 place-items-center rounded-xl border bg-card text-muted-foreground shadow-xs outline-none transition hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30 lg:hidden"
      >
        <Menu className="size-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl p-1.5">
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/quran">
            <BookOpenCheck /> আল-কুরআন
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/login?next=/dashboard/hadith">
            <BookMarked /> হাদীস
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/names-of-allah">
            <Sparkles /> আল্লাহর ৯৯ নাম
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/prayer/duas">
            <ScrollText /> নামাজের দু&apos;আ
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/library">
            <Library /> কিতাবখানা
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg"><Link href="/dua"><BookOpen /> দোয়া ও যিকির</Link></DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg"><Link href="/mahram"><UsersRound /> মাহরাম তালিকা</Link></DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/calendar">
            <CalendarDays /> হিজরি ক্যালেন্ডার
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10 rounded-lg" onSelect={(event) => { event.preventDefault(); setTheme(isDark ? "light" : "dark"); }}>
          {isDark ? <Sun /> : <Moon />} {isDark ? "লাইট মোড" : "ডার্ক মোড"}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/login?mode=register">
            <UserPlus /> নতুন নিবন্ধন
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
