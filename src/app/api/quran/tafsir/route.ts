import { NextRequest, NextResponse } from "next/server";

export const revalidate = 604800; // 7 days

const ALLOWED_TAFSIRS = [166, 164, 165, 381] as const;
type AllowedTafsirId = (typeof ALLOWED_TAFSIRS)[number];

const TAFSIR_NAMES: Record<AllowedTafsirId, string> = {
  166: "তাফসীর আবু বকর জাকারিয়া",
  164: "তাফসীর ইবনে কাসীর",
  165: "তাফসীর আহসানুল বায়ান",
  381: "তাফসীর ফাতহুল মাজীদ",
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const surah = Number(searchParams.get("surah"));
  const ayah = Number(searchParams.get("ayah"));
  const requestedId = Number(searchParams.get("id") || "166");

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return NextResponse.json({ error: "সঠিক সূরা নম্বর দিন (১–১১৪)" }, { status: 400 });
  }

  if (!Number.isInteger(ayah) || ayah < 1) {
    return NextResponse.json({ error: "সঠিক আয়াত নম্বর দিন" }, { status: 400 });
  }

  const tafsirId: AllowedTafsirId = (ALLOWED_TAFSIRS as readonly number[]).includes(requestedId)
    ? (requestedId as AllowedTafsirId)
    : 166;

  try {
    const upstreamUrl = `https://api.quran.com/api/v4/tafsirs/${tafsirId}/by_ayah/${surah}:${ayah}`;
    const response = await fetch(upstreamUrl, {
      next: { revalidate: 604800 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `তাফসীর পাওয়া যায়নি (${response.status})` }, { status: 502 });
    }

    const data = (await response.json()) as {
      tafsir?: {
        text?: string;
        resource_name?: string;
        resource_id?: number;
      };
    };

    const text = data.tafsir?.text?.trim() || "";

    return NextResponse.json(
      {
        surah,
        ayah,
        tafsirId,
        tafsirName: TAFSIR_NAMES[tafsirId] || data.tafsir?.resource_name || "তাফসীর",
        text,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("Tafsir fetch error:", error);
    return NextResponse.json({ error: "তাফসীর লোড করতে সমস্যা হয়েছে" }, { status: 502 });
  }
}
