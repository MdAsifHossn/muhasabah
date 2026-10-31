"use client";

import { BookMarked, BookOpenCheck, CalendarDays, ChevronDown, ClipboardCheck, KeyRound, LayoutDashboard, Library, LogOut, MessagesSquare, Moon, Sun, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

/** Avatar button in the top bar → account menu (profile, password, messages, theme, logout). */
export function UserMenu({
  name,
  email,
  roleLabel,
  isStaff,
  site = false,
}: {
  name: string;
  email: string;
  roleLabel: string;
  isStaff: boolean;
  /** On public pages (landing, calendar) also offer the way into the app and the reading pages. */
  site?: boolean;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const isDark = resolvedTheme === "dark";

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 pr-1 outline-none transition hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/30 lg:pr-2.5"
        aria-label="অ্যাকাউন্ট মেনু"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{name.trim().slice(0, 1)}</span>
        <span className="hidden max-w-40 truncate text-sm font-medium lg:block">{name}</span>
        <ChevronDown className="hidden size-4 text-muted-foreground lg:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 rounded-xl p-1.5">
        <DropdownMenuLabel className="px-2.5 py-2">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{email}</span>
          <span className="mt-1.5 inline-flex rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-soft-foreground">{roleLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {site ? (
          <>
            <DropdownMenuItem asChild className="h-10 rounded-lg">
              <Link href="/dashboard">
                <LayoutDashboard /> ড্যাশবোর্ড
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="h-10 rounded-lg">
              <Link href="/dashboard/amalnama">
                <ClipboardCheck /> আজকের আমল
              </Link>
            </DropdownMenuItem>
            <div className="lg:hidden">
              <DropdownMenuItem asChild className="h-10 rounded-lg">
                <Link href="/quran">
                  <BookOpenCheck /> আল-কুরআন
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="h-10 rounded-lg">
                <Link href="/dashboard/hadith">
                  <BookMarked /> হাদীস
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="h-10 rounded-lg">
                <Link href="/library">
                  <Library /> কিতাবখানা
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="h-10 rounded-lg">
                <Link href="/calendar">
                  <CalendarDays /> হিজরি ক্যালেন্ডার
                </Link>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/dashboard/profile">
            <UserRound /> প্রোফাইল ও সেটিংস
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href="/dashboard/profile#password">
            <KeyRound /> পাসওয়ার্ড পরিবর্তন
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="h-10 rounded-lg">
          <Link href={isStaff ? "/dashboard/ustad/messages" : "/dashboard/messages"}>
            {isStaff ? <UsersRound /> : <MessagesSquare />} {isStaff ? "সদস্যদের বার্তা" : "উস্তাদজিকে বার্তা"}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="h-10 rounded-lg" onSelect={(event) => { event.preventDefault(); setTheme(isDark ? "light" : "dark"); }}>
          {isDark ? <Sun /> : <Moon />} {isDark ? "লাইট মোড" : "ডার্ক মোড"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="h-10 rounded-lg" disabled={signingOut} onSelect={signOut}>
          <LogOut /> {signingOut ? "বের হচ্ছে…" : "লগআউট"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
