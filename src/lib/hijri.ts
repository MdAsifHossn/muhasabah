/**
 * Hijri calendar helpers — offline, no API.
 *
 * Dates come from the built-in Intl Umm al-Qura calendar, shifted by
 * HIJRI_OFFSET_DAYS for the Bangladesh moon sighting (same rule as
 * `formatHijriDate` in src/lib/dates.ts). Gregorian days are handled as plain
 * calendar days (UTC-midnight Dates of the Bangladesh day) so the server's
 * time zone never shifts a date. Safe to import in client components.
 */

/** Bangladesh usually sights the moon one day after Saudi Arabia. */
export const HIJRI_OFFSET_DAYS = -1;

const DAY_MS = 86_400_000;

export const HIJRI_MONTHS_BN = [
  "মুহাররম",
  "সফর",
  "রবিউল আউয়াল",
  "রবিউস সানি",
  "জুমাদাল উলা",
  "জুমাদাল উখরা",
  "রজব",
  "শাবান",
  "রমজান",
  "শাওয়াল",
  "জিলকদ",
  "জিলহজ",
] as const;

export const HIJRI_MONTHS_AR = [
  "مُحَرَّم",
  "صَفَر",
  "رَبِيع الأَوَّل",
  "رَبِيع الآخِر",
  "جُمَادَى الأُولَى",
  "جُمَادَى الآخِرَة",
  "رَجَب",
  "شَعْبَان",
  "رَمَضَان",
  "شَوَّال",
  "ذُو القَعْدَة",
  "ذُو الحِجَّة",
] as const;

export const GREGORIAN_MONTHS_BN = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"] as const;

export const BANGLA_MONTHS = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"] as const;

/** Index = JS weekday (0 = Sunday). */
export const WEEKDAYS_BN = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"] as const;

/** Column headers, week starting Saturday. */
export const WEEK_HEADERS_BN = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র"] as const;

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export function bn(value: string | number) {
  return String(value).replace(/[0-9]/g, (digit) => BN_DIGITS[Number(digit)]);
}

/* ── Gregorian day arithmetic ───────────────────────────────────────── */

export type GDay = { y: number; m: number; d: number };

export function gToMs(day: GDay) {
  return Date.UTC(day.y, day.m - 1, day.d);
}

export function msToG(ms: number): GDay {
  const date = new Date(ms);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
}

export function gIso(day: GDay) {
  return `${day.y}-${String(day.m).padStart(2, "0")}-${String(day.d).padStart(2, "0")}`;
}

export function addGDays(day: GDay, count: number) {
  return msToG(gToMs(day) + count * DAY_MS);
}

export function gWeekday(day: GDay) {
  return new Date(gToMs(day)).getUTCDay();
}

/** Today's calendar day in Bangladesh. */
export function todayInDhaka(now: Date = new Date()): GDay {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { y: pick("year"), m: pick("month"), d: pick("day") };
}

/* ── Hijri conversion ───────────────────────────────────────────────── */

export type HDate = { y: number; m: number; d: number };

let formatter: Intl.DateTimeFormat | null = null;
function hijriFormatter() {
  if (formatter) return formatter;
  for (const calendar of ["islamic-umalqura", "islamic-civil", "islamic"]) {
    try {
      const candidate = new Intl.DateTimeFormat(`en-u-ca-${calendar}-nu-latn`, { timeZone: "UTC", year: "numeric", month: "numeric", day: "numeric" });
      if (candidate.resolvedOptions().calendar.startsWith("islamic")) {
        formatter = candidate;
        return candidate;
      }
    } catch {
      /* try the next calendar */
    }
  }
  throw new Error("Hijri calendar is not supported by this runtime");
}

/** Hijri date (Bangladesh) of a Gregorian calendar day. */
export function toHijri(day: GDay): HDate {
  const parts = hijriFormatter().formatToParts(new Date(gToMs(day) + HIJRI_OFFSET_DAYS * DAY_MS + DAY_MS / 2));
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { y: pick("year"), m: pick("month"), d: pick("day") };
}

/** Gregorian day on which `1 Muharram` of Hijri year `year` falls (Bangladesh). */
export function hijriYearStart(year: number): GDay {
  const estimate = Date.UTC(622, 6, 19) + (year - 1) * 354.36667 * DAY_MS;
  const base = msToG(estimate - 25 * DAY_MS);
  for (let index = 0; index < 60; index += 1) {
    const day = addGDays(base, index);
    const h = toHijri(day);
    if (h.y === year && h.m === 1 && h.d === 1) return day;
  }
  // Fallback (should never happen): walk until the year rolls over.
  return base;
}

/* ── Bangla (Bangabda, revised 2019) date ───────────────────────────── */

function isLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Bangladesh revised (2019) calendar: Boishakh–Ashwin 31 days, Falgun 29
 * (30 in a leap year), the rest 30 — so 21 Feb = ৮ ফাল্গুন, 16 Dec = ১ পৌষ.
 */
export function banglaCalendarDate(day: GDay) {
  const startYear = gToMs(day) >= Date.UTC(day.y, 3, 14) ? day.y : day.y - 1;
  let offset = Math.round((gToMs(day) - Date.UTC(startYear, 3, 14)) / DAY_MS);
  const lengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap(startYear + 1) ? 30 : 29, 30];
  let month = 0;
  while (month < 11 && offset >= lengths[month]) {
    offset -= lengths[month];
    month += 1;
  }
  return `${bn(offset + 1)} ${BANGLA_MONTHS[month]} ${bn(startYear - 593)}`;
}

/* ── Important days ─────────────────────────────────────────────────── */

export type EventKind = "newyear" | "ashura" | "miraj" | "barat" | "ramadan" | "qadr" | "eidFitr" | "arafah" | "eidAdha" | "tashriq" | "bid" | "monThu";

export const EVENT_INFO: Record<EventKind, { label: string; short: string; description: string; night?: boolean }> = {
  newyear: { label: "হিজরি নববর্ষ", short: "নববর্ষ", description: "নতুন হিজরি বছরের প্রথম দিন (১ মুহাররম)।" },
  ashura: { label: "আশুরা", short: "আশুরা", description: "মুহাররমের ৯ ও ১০ তারিখ — আশুরার রোজা সুন্নাত (৯–১০ অথবা ১০–১১)।" },
  miraj: { label: "শবে মেরাজ", short: "মেরাজ", description: "২৭ রজবের রাত — নবীজি ﷺ-এর মেরাজের ঐতিহাসিক স্মরণ।", night: true },
  barat: { label: "শবে বরাত", short: "বরাত", description: "শাবানের মধ্যরাত (১৫ শাবানের রাত)।", night: true },
  ramadan: { label: "রমজান শুরু", short: "রমজান", description: "রহমত, মাগফিরাত ও নাজাতের মাস — ফরজ রোজা শুরু।" },
  qadr: { label: "লাইলাতুল কদরের সম্ভাব্য রাত", short: "কদর", description: "রমজানের শেষ দশকের বিজোড় রাত — হাজার মাসের চেয়ে উত্তম।", night: true },
  eidFitr: { label: "ঈদুল ফিতর", short: "ঈদ", description: "১ শাওয়াল — ঈদুল ফিতর। এদিন রোজা রাখা নিষেধ।" },
  arafah: { label: "আরাফার দিন", short: "আরাফা", description: "৯ জিলহজ — হাজী নন এমন ব্যক্তির জন্য আরাফার রোজা অত্যন্ত ফজিলতপূর্ণ।" },
  eidAdha: { label: "ঈদুল আযহা", short: "ঈদ", description: "১০ জিলহজ — কুরবানির ঈদ। এদিন রোজা রাখা নিষেধ।" },
  tashriq: { label: "আইয়ামে তাশরিক", short: "তাশরিক", description: "১১–১৩ জিলহজ — তাকবীরে তাশরিকের দিন; রোজা রাখা নিষেধ।" },
  bid: { label: "আইয়ামে বীজ", short: "বীজ", description: "প্রতি হিজরি মাসের ১৩, ১৪, ১৫ তারিখ — সুন্নাত নফল রোজা।" },
  monThu: { label: "সোম ও বৃহস্পতিবার", short: "সুন্নাত রোজা", description: "সোমবার ও বৃহস্পতিবারের নফল রোজা সুন্নাত।" },
};

/** Static class names so Tailwind picks them up. */
export const EVENT_TONES: Record<EventKind, { dot: string; soft: string }> = {
  newyear: { dot: "bg-cat-reading", soft: "bg-cat-reading/14 text-cat-reading" },
  ashura: { dot: "bg-cat-dhikr", soft: "bg-cat-dhikr/14 text-cat-dhikr" },
  miraj: { dot: "bg-cat-quran", soft: "bg-cat-quran/14 text-cat-quran" },
  barat: { dot: "bg-cat-sunnah", soft: "bg-cat-sunnah/14 text-cat-sunnah" },
  ramadan: { dot: "bg-primary", soft: "bg-primary-soft text-primary-soft-foreground" },
  qadr: { dot: "bg-cat-discipline", soft: "bg-cat-discipline/14 text-cat-discipline" },
  eidFitr: { dot: "bg-gold", soft: "bg-gold-soft text-gold-foreground" },
  arafah: { dot: "bg-cat-service", soft: "bg-cat-service/14 text-cat-service" },
  eidAdha: { dot: "bg-gold", soft: "bg-gold-soft text-gold-foreground" },
  tashriq: { dot: "bg-cat-character", soft: "bg-cat-character/14 text-cat-character" },
  bid: { dot: "bg-cat-salah", soft: "bg-cat-salah/14 text-cat-salah" },
  monThu: { dot: "bg-subtle-foreground", soft: "bg-muted text-muted-foreground" },
};

/** Legend order (major days first). */
export const LEGEND: EventKind[] = ["newyear", "ashura", "miraj", "barat", "ramadan", "qadr", "eidFitr", "arafah", "eidAdha", "tashriq", "bid", "monThu"];

const FORBIDDEN_FAST = (h: HDate) => (h.m === 10 && h.d === 1) || (h.m === 12 && h.d >= 10 && h.d <= 13);

export function eventsFor(h: HDate, weekday: number): EventKind[] {
  const events: EventKind[] = [];
  if (h.m === 1 && h.d === 1) events.push("newyear");
  if (h.m === 1 && (h.d === 9 || h.d === 10)) events.push("ashura");
  if (h.m === 7 && h.d === 27) events.push("miraj");
  if (h.m === 8 && h.d === 15) events.push("barat");
  if (h.m === 9 && h.d === 1) events.push("ramadan");
  if (h.m === 9 && h.d >= 21 && h.d % 2 === 1) events.push("qadr");
  if (h.m === 10 && h.d === 1) events.push("eidFitr");
  if (h.m === 12 && h.d === 9) events.push("arafah");
  if (h.m === 12 && h.d === 10) events.push("eidAdha");
  if (h.m === 12 && h.d >= 11 && h.d <= 13) events.push("tashriq");
  if (h.d >= 13 && h.d <= 15 && h.m !== 9 && !FORBIDDEN_FAST(h)) events.push("bid");
  if ((weekday === 1 || weekday === 4) && h.m !== 9 && !FORBIDDEN_FAST(h)) events.push("monThu");
  return events;
}

/** Plain-language fasting / worship notes for the day sheet. */
export function dayNotes(h: HDate, weekday: number): string[] {
  const notes: string[] = [];
  if (h.m === 9) notes.push("রমজানের ফরজ রোজা।");
  if (FORBIDDEN_FAST(h)) notes.push("এ দিনে রোজা রাখা নিষেধ।");
  if (h.m === 10 && h.d >= 2) notes.push("শাওয়ালের ছয়টি নফল রোজা রাখার সুযোগ।");
  if (h.m === 12 && h.d <= 9) notes.push("জিলহজের প্রথম দশক — বছরের শ্রেষ্ঠ দিনগুলো; বেশি বেশি তাকবীর, তাহলীল ও নেক আমল।");
  if (weekday === 5) notes.push("জুমার দিন — সূরা কাহাফ, বেশি বেশি দরূদ ও আসরের পর দোয়া।");
  return notes;
}

/* ── Year model ─────────────────────────────────────────────────────── */

export type CalendarDay = {
  iso: string;
  g: GDay;
  h: HDate;
  weekday: number;
  /** Column in a Saturday-first week (0 = Saturday … 6 = Friday). */
  col: number;
  events: EventKind[];
};

export type CalendarMonth = { month: number; year: number; days: CalendarDay[]; gregorianLabel: string };

function gregorianSpan(first: GDay, last: GDay) {
  const a = GREGORIAN_MONTHS_BN[first.m - 1];
  const b = GREGORIAN_MONTHS_BN[last.m - 1];
  if (first.y === last.y) return first.m === last.m ? `${a} ${bn(first.y)}` : `${a} – ${b} ${bn(last.y)}`;
  return `${a} ${bn(first.y)} – ${b} ${bn(last.y)}`;
}

export function buildHijriYear(year: number): CalendarMonth[] {
  const start = hijriYearStart(year);
  const months: CalendarMonth[] = [];
  for (let index = 0; index < 360; index += 1) {
    const g = addGDays(start, index);
    const h = toHijri(g);
    if (h.y !== year) break;
    const weekday = gWeekday(g);
    const day: CalendarDay = { iso: gIso(g), g, h, weekday, col: (weekday + 1) % 7, events: eventsFor(h, weekday) };
    const current = months[h.m - 1] ?? (months[h.m - 1] = { month: h.m, year, days: [], gregorianLabel: "" });
    current.days.push(day);
  }
  for (const month of months) month.gregorianLabel = gregorianSpan(month.days[0].g, month.days[month.days.length - 1].g);
  return months;
}

/* ── Upcoming important days ────────────────────────────────────────── */

export type UpcomingEvent = { kind: EventKind; iso: string; daysLeft: number; h: HDate; g: GDay; weekday: number };

const UPCOMING_KINDS: EventKind[] = ["newyear", "ashura", "miraj", "barat", "ramadan", "qadr", "eidFitr", "arafah", "eidAdha", "bid"];

/** First occurrence (from today) of each major event, nearest first. */
export function upcomingEvents(today: GDay, horizon = 400): UpcomingEvent[] {
  const found = new Map<EventKind, UpcomingEvent>();
  for (let index = 0; index <= horizon && found.size < UPCOMING_KINDS.length; index += 1) {
    const g = addGDays(today, index);
    const h = toHijri(g);
    const weekday = gWeekday(g);
    for (const kind of eventsFor(h, weekday)) {
      if (UPCOMING_KINDS.includes(kind) && !found.has(kind)) found.set(kind, { kind, iso: gIso(g), daysLeft: index, h, g, weekday });
    }
  }
  return [...found.values()].sort((a, b) => a.daysLeft - b.daysLeft);
}

export function formatHijri(h: HDate) {
  return `${bn(h.d)} ${HIJRI_MONTHS_BN[h.m - 1]} ${bn(h.y)} হিজরি`;
}

export function formatGregorian(g: GDay) {
  return `${bn(g.d)} ${GREGORIAN_MONTHS_BN[g.m - 1]} ${bn(g.y)}`;
}

export function daysLeftLabel(days: number) {
  if (days === 0) return "আজ";
  if (days === 1) return "আগামীকাল";
  return `${bn(days)} দিন বাকি`;
}
