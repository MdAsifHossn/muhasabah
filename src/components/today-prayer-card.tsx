"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Sunrise, Sunset, Clock3 } from "lucide-react";
import type { PrayerTiming } from "@/lib/prayer-times";

type Props = {
  timings: PrayerTiming;
  hijriDate: string;
  banglaDate: string;
  englishDate: string;
};

function getActiveWaqt(mins: PrayerTiming["minutes"], currentMinutes: number): string {
  const { fajr, sunrise, ishraq, dhuhr, asr, maghrib, isha } = mins;
  if (currentMinutes >= fajr && currentMinutes < sunrise) return "fajr";
  if (currentMinutes >= sunrise && currentMinutes < ishraq) return "sunrise";
  if (currentMinutes >= ishraq && currentMinutes < dhuhr) return "ishraq";
  if (currentMinutes >= dhuhr && currentMinutes < asr) return "dhuhr";
  if (currentMinutes >= asr && currentMinutes < maghrib) return "asr";
  if (currentMinutes >= maghrib && currentMinutes < isha) return "maghrib";
  return "isha";
}

function getDhakaMinutes(): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    return hour * 60 + minute;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

export function TodayPrayerCard({
  timings,
  hijriDate,
  banglaDate,
  englishDate,
}: Props) {
  const [activeWaqt, setActiveWaqt] = useState<string>(() =>
    getActiveWaqt(timings.minutes, getDhakaMinutes())
  );

  useEffect(() => {
    function update() {
      setActiveWaqt(getActiveWaqt(timings.minutes, getDhakaMinutes()));
    }
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [timings.minutes]);

  const prayers = [
    { key: "fajr", label: "ফজর", time: timings.fajr, icon: Sunrise, tag: "ফরজ" },
    { key: "ishraq", label: "ইশরাক", time: timings.ishraq, icon: Sun, tag: "নফল" },
    { key: "dhuhr", label: "যোহর", time: timings.dhuhr, icon: Sun, tag: "ফরজ" },
    { key: "asr", label: "আসর", time: timings.asr, icon: Sun, tag: "ফরজ" },
    { key: "maghrib", label: "মাগরিব", time: timings.maghrib, icon: Sunset, tag: "ফরজ" },
    { key: "isha", label: "এশা", time: timings.isha, icon: Moon, tag: "ফরজ" },
  ];

  return (
    <div
      id="today"
      className="w-full self-center rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-2xl shadow-emerald-950/10 sm:p-8"
    >
      {/* Date Header */}
      <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-5">
        <div className="space-y-2">
          {/* Hijri Date + Location Tag */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50/90 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-xs">
              <Moon className="size-3.5 text-emerald-600" />
              <span>{hijriDate}</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-600">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ঢাকা • লাইভ ওয়াক্ত
            </span>
          </div>

          <p className="text-xl font-black text-emerald-950 sm:text-2xl">
            {banglaDate}
          </p>
          <p className="text-xs font-medium text-stone-400">
            {englishDate}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-emerald-800 shadow-xs">
          <Clock3 className="size-6" />
        </div>
      </div>

      {/* 6 Waqt Grid (Fajr, Ishraq, Dhuhr, Asr, Maghrib, Isha) */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {prayers.map(({ key, label, time, icon: Icon, tag }) => {
          const isActive = activeWaqt === key;
          return (
            <div
              key={key}
              className={`relative rounded-2xl p-3 text-center transition-all ${
                isActive
                  ? "border-2 border-emerald-500 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20"
                  : "border border-stone-100 bg-[#f8faf9] hover:bg-emerald-50/40"
              }`}
            >
              {isActive ? (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
                    <span className="size-1 rounded-full bg-emerald-200 animate-ping" />
                    চলমান
                  </span>
                </div>
              ) : null}

              <Icon
                className={`mx-auto size-4 ${
                  isActive ? "text-emerald-700" : "text-stone-400"
                }`}
              />
              <div className="mt-1.5 flex items-center justify-center gap-1">
                <p
                  className={`text-xs ${
                    isActive
                      ? "font-black text-emerald-950"
                      : "font-bold text-stone-600"
                  }`}
                >
                  {label}
                </p>
                {tag === "নফল" ? (
                  <span className="rounded bg-sky-100 px-1 py-0.2 text-[9px] font-semibold text-sky-800">
                    নফল
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-1 text-xs sm:text-sm font-black ${
                  isActive ? "text-emerald-950" : "text-stone-800"
                }`}
              >
                {time}
              </p>
            </div>
          );
        })}
      </div>

      {/* Fasting & Sun times: Sahari End, Sunrise, Iftar */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-sky-100 bg-sky-50/90 p-3 text-sky-950 sm:p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-sky-900">
            <Moon className="size-3.5 text-sky-700" />
            সেহরি শেষ
          </p>
          <p className="mt-1 text-sm font-black sm:text-lg">{timings.sahariEnd}</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/90 p-3 text-amber-950 sm:p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
            <Sunrise className="size-3.5 text-amber-700" />
            সূর্যোদয়
          </p>
          <p className="mt-1 text-sm font-black sm:text-lg">{timings.sunrise}</p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/90 p-3 text-rose-950 sm:p-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-rose-900">
            <Sun className="size-3.5 text-rose-700" />
            ইফতার
          </p>
          <p className="mt-1 text-sm font-black sm:text-lg">{timings.iftar}</p>
        </div>
      </div>
    </div>
  );
}
