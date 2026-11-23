import { NextResponse } from "next/server";

import { isValidTimeZone } from "@/lib/prayer-location";
import { fetchPrayerTiming } from "@/lib/prayer-times-remote";

/**
 * GET /api/prayer-times?lat=&lon=&tz=&name= → today's PrayerTiming for any place.
 * Calculated by AlAdhan for the coordinates, Asr by the Hanafi school (like the rest of the app).
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const rawLat = params.get("lat");
  const rawLon = params.get("lon");
  if (!rawLat?.trim() || !rawLon?.trim()) return NextResponse.json({ error: "অবস্থান সঠিক নয়" }, { status: 400 });
  // ~1 km precision: nearly identical times, far fewer distinct upstream requests.
  const lat = Math.round(Number(rawLat) * 100) / 100;
  const lon = Math.round(Number(rawLon) * 100) / 100;
  const tz = params.get("tz") ?? "";
  const name = (params.get("name") ?? "").trim().slice(0, 80) || "আমার অবস্থান";
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180 || !isValidTimeZone(tz)) {
    return NextResponse.json({ error: "অবস্থান সঠিক নয়" }, { status: 400 });
  }
  const timing = await fetchPrayerTiming(lat, lon, tz, name);
  if (!timing) return NextResponse.json({ error: "সময় পাওয়া যায়নি" }, { status: 502 });
  return NextResponse.json(timing, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
}
