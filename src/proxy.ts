import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // The Quran reader is PUBLIC at /quran — redirect the old private URL
  // BEFORE the session check so guests AND members (bookmarks, PWA/offline
  // links, old dashboard links) land straight in the reader, never in the
  // login wall. Query params (e.g. ?mode=juz&juz=30) are preserved.
  const path = request.nextUrl.pathname.replace(/\/+$/, "");
  if (path === "/dashboard/quran") {
    const readerUrl = new URL("/quran", request.url);
    readerUrl.search = request.nextUrl.search;
    return NextResponse.redirect(readerUrl, 307);
  }

  if (!getSessionCookie(request)) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("auth", "login");
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
