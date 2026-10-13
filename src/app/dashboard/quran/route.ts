import { NextResponse, type NextRequest } from "next/server";

/**
 * `/dashboard/quran` → `/quran` (temporary redirect, query preserved).
 *
 * The reader is now PUBLIC at `/quran`; this keeps old links, PWA/offline
 * paths and bookmarks working for members. Guests are handled one layer up in
 * `src/proxy.ts`, which redirects the same path BEFORE its session-cookie
 * check — together the two guarantees cover every visitor, and this Route
 * Handler remains correct on its own if the proxy matcher ever changes
 * (route handlers are not wrapped by the `requireUser()` gate in
 * `src/app/dashboard/layout.tsx`).
 */
export function GET(request: NextRequest) {
  const target = new URL("/quran", request.url);
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 307);
}
