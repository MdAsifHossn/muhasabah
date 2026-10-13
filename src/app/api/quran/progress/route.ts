import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  isFontSize,
  isReciter,
  isViewMode,
  JUZ_COUNT,
  MAX_AYAHS_PER_SURAH,
  sanitizeReadAyahs,
  SURAH_COUNT,
  toIntInRange,
  TOTAL_AYAHS,
  type QuranProgressRecord,
} from "@/lib/quran-progress";
import { prisma } from "@/lib/prisma";

/**
 * Quran reading progress for the CURRENT session user only.
 *
 * Auth follows the repo convention (`auth.api.getSession({ headers })` as used
 * in `src/lib/permissions.ts` / `src/app/page.tsx`) but answers 401 instead of
 * redirecting, because these are API endpoints, not pages. The userId always
 * comes from the session — a client-supplied userId is ignored entirely.
 */

type Row = {
  id: string;
  mode: string;
  surah: number;
  juz: number | null;
  ayahInSurah: number;
  globalAyah: number;
  viewMode: string | null;
  fontSize: string | null;
  reciter: string | null;
  readAyahs: number[];
  updatedAt: Date;
};

function serialize(row: Row): QuranProgressRecord {
  return {
    id: row.id,
    mode: row.mode === "juz" ? "juz" : "surah",
    surah: row.surah,
    juz: row.juz,
    ayahInSurah: row.ayahInSurah,
    globalAyah: row.globalAyah,
    viewMode: isViewMode(row.viewMode) ? row.viewMode : null,
    fontSize: isFontSize(row.fontSize) ? row.fontSize : null,
    reciter: isReciter(row.reciter) ? row.reciter : null,
    readAyahs: row.readAyahs ?? [],
    updatedAt: row.updatedAt.toISOString(),
  };
}

const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 });
const badRequest = (error: string) => Response.json({ error }, { status: 400 });

/** Returns the active session user's id, or null → 401. */
async function sessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.user.isActive) return null;
  return session.user.id;
}

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();

  try {
    const progress = await prisma.quranProgress.findUnique({ where: { userId } });
    return Response.json(progress ? serialize(progress) : null, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Progress unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest("Body must be an object");
  }
  const input = body as Record<string, unknown>;

  const mode = input.mode === "juz" ? "juz" : input.mode === "surah" ? "surah" : null;
  if (!mode) return badRequest("mode must be \"surah\" or \"juz\"");

  const surah = toIntInRange(input.surah, 1, SURAH_COUNT);
  const ayahInSurah = toIntInRange(input.ayahInSurah, 1, MAX_AYAHS_PER_SURAH);
  const globalAyah = toIntInRange(input.globalAyah, 1, TOTAL_AYAHS);
  if (surah === null || ayahInSurah === null || globalAyah === null) {
    return badRequest("surah / ayahInSurah / globalAyah out of range");
  }

  const juz = mode === "juz" ? toIntInRange(input.juz, 1, JUZ_COUNT) : null;
  if (mode === "juz" && juz === null) return badRequest("juz must be 1..30 when mode is \"juz\"");

  // Optional reading preferences — ignored when malformed, preserved otherwise.
  const viewMode = input.viewMode === undefined ? undefined : isViewMode(input.viewMode) ? input.viewMode : null;
  const fontSize = input.fontSize === undefined ? undefined : isFontSize(input.fontSize) ? input.fontSize : null;
  const reciter = input.reciter === undefined ? undefined : isReciter(input.reciter) ? input.reciter : null;
  // Only newly-seen numbers are accepted; the union happens server-side.
  const newRead = sanitizeReadAyahs(input.newRead);

  try {
    const existing = await prisma.quranProgress.findUnique({ where: { userId } });
    const data = {
      mode,
      surah,
      juz,
      ayahInSurah,
      globalAyah,
      viewMode: viewMode !== undefined ? viewMode : (existing?.viewMode ?? null),
      fontSize: fontSize !== undefined ? fontSize : (existing?.fontSize ?? null),
      reciter: reciter !== undefined ? reciter : (existing?.reciter ?? null),
      readAyahs: sanitizeReadAyahs([...(existing?.readAyahs ?? []), ...newRead]),
    };
    const progress = await prisma.quranProgress.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
    return Response.json(serialize(progress), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Progress unavailable" }, { status: 500 });
  }
}
