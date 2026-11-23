import { NextResponse } from "next/server";

import { isValidTimeZone } from "@/lib/prayer-location";
import { timingFromAladhan } from "@/lib/prayer-times";

/** Karachi (Hanafi tradition) is the common method across South Asia; elsewhere AlAdhan picks one for the coordinates. */
const SOUTH_ASIA_ZONES = new Set(["Asia/Dhaka", "Asia/Karachi", "Asia/Kolkata", "Asia/Calcutta", "Asia/Kathmandu", "Asia/Colombo"]);

/**
 * GET /api/prayer-times?lat=&lon=&tz=&name= → today's PrayerTiming for any place.
 * Calculated by AlAdhan for the coordinates, Asr by the Hanafi school (like the rest of the app).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const tz = params.get("tz") ?? "";
  const name = (params.get("name") ?? "").trim().slice(0, 80) || "আমার অবস্থান";
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !isValidTimeZone(tz)) {
    return NextResponse.json({ error: "অবস্থান সঠিক নয়" }, { status: 400 });
  }

  const [day, month, year] = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date()).split("/");
  const url = new URL(`https://api.aladhan.com/v1/timings/${day}-${month}-${year}`);
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("school", "1");
  url.searchParams.set("timezonestring", tz);
  if (SOUTH_ASIA_ZONES.has(tz)) url.searchParams.set("method", "1");

  try {
    const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return NextResponse.json({ error: "সময় পাওয়া যায়নি" }, { status: 502 });
    const json = (await response.json()) as { data?: { timings?: Record<string, string> } };
    if (!json.data?.timings) return NextResponse.json({ error: "সময় পাওয়া যায়নি" }, { status: 502 });
    return NextResponse.json(timingFromAladhan(json.data.timings, name), { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "সময় পাওয়া যায়নি" }, { status: 502 });
  }
}
