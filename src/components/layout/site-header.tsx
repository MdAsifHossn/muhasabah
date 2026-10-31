import { Role } from "@prisma/client";
import { headers } from "next/headers";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { GuestMenu } from "@/components/layout/guest-menu";
import { ShareButton } from "@/components/layout/share-button";
import { SiteNavLinks } from "@/components/layout/site-nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { roleLabels } from "@/lib/constants";
import { isStaffRole } from "@/lib/permissions";

/**
 * Top bar for public pages (landing, calendar). Same account dropdown as the
 * dashboard when signed in; guests get a compact menu + "প্রবেশ".
 */
export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user?.isActive ? session.user : null;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <SiteNavLinks signedIn={Boolean(user)} />
          <ThemeToggle className="hidden sm:grid" />
          <ShareButton />
          {user ? (
            <UserMenu site name={user.name} email={user.email} roleLabel={roleLabels[user.role as Role]} isStaff={isStaffRole(user.role)} />
          ) : (
            <>
              <GuestMenu />
              <Button asChild size="sm" className="h-10 px-4">
                <Link href="/login">প্রবেশ</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
