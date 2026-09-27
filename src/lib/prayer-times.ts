export type PrayerTiming = {
  fajr: string;
  sunrise: string;
  ishraq: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  sahariEnd: string;
  iftar: string;
  district: string;
  source: "live" | "fallback";
  minutes: {
    fajr: number;
    sunrise: number;
    ishraq: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
    sahariEnd: number;
    iftar: number;
  };
};

function parseMinutes(raw: string | undefined, defaultMinutes: number): number {
  if (!raw) return defaultMinutes;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return defaultMinutes;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function formatMinutesTo12h(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const fallbackMinutes = {
  fajr: 4 * 60 + 33,
  sunrise: 5 * 60 + 48,
  ishraq: 5 * 60 + 48 + 15,
  dhuhr: 11 * 60 + 50,
  asr: 16 * 60 + 11,
  maghrib: 17 * 60 + 51,
  isha: 19 * 60 + 6,
  sahariEnd: 4 * 60 + 23,
  iftar: 17 * 60 + 51,
};

const fallback: PrayerTiming = {
  district: "ঢাকা",
  fajr: "4:33 AM",
  sunrise: "5:48 AM",
  ishraq: "6:03 AM",
  dhuhr: "11:50 AM",
  asr: "4:11 PM",
  maghrib: "5:51 PM",
  isha: "7:06 PM",
  sahariEnd: "4:23 AM",
  iftar: "5:51 PM",
  source: "fallback",
  minutes: fallbackMinutes,
};

type AlAdhanResponse = { code: number; data?: { timings?: Record<string, string> } };

export async function getTodayFastingInfo(): Promise<PrayerTiming> {
  try {
    const response = await fetch("https://api.aladhan.com/v1/timingsByCity?city=Dhaka&country=Bangladesh&method=1&school=1", { next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return fallback;
    const json = await response.json() as AlAdhanResponse;
    const t = json.data?.timings;
    if (!t) return fallback;

    const sunriseMin = parseMinutes(t.Sunrise, fallbackMinutes.sunrise);
    const ishraqMin = sunriseMin + 15; // Ishraq begins ~15 mins after sunrise

    const mins = {
      fajr: parseMinutes(t.Fajr, fallbackMinutes.fajr),
      sunrise: sunriseMin,
      ishraq: ishraqMin,
      dhuhr: parseMinutes(t.Dhuhr, fallbackMinutes.dhuhr),
      asr: parseMinutes(t.Asr, fallbackMinutes.asr),
      maghrib: parseMinutes(t.Maghrib, fallbackMinutes.maghrib),
      isha: parseMinutes(t.Isha, fallbackMinutes.isha),
      sahariEnd: parseMinutes(t.Imsak, fallbackMinutes.sahariEnd),
      iftar: parseMinutes(t.Maghrib, fallbackMinutes.iftar),
    };

    return {
      district: "ঢাকা",
      fajr: formatMinutesTo12h(mins.fajr),
      sunrise: formatMinutesTo12h(mins.sunrise),
      ishraq: formatMinutesTo12h(mins.ishraq),
      dhuhr: formatMinutesTo12h(mins.dhuhr),
      asr: formatMinutesTo12h(mins.asr),
      maghrib: formatMinutesTo12h(mins.maghrib),
      isha: formatMinutesTo12h(mins.isha),
      sahariEnd: formatMinutesTo12h(mins.sahariEnd),
      iftar: formatMinutesTo12h(mins.iftar),
      source: "live",
      minutes: mins,
    };
  } catch {
    return fallback;
  }
}