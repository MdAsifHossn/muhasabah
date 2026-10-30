/** Chat date helpers — always Bangladesh time, Bangla digits. */

const TZ = "Asia/Dhaka";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
const toBn = (value: string) => value.replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
const dateFmt = new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("bn-BD", { timeZone: TZ, day: "numeric", month: "short" });

export function chatDayKey(iso: string) {
  return dayKey.format(new Date(iso));
}

/** "ভোর ৫:১০", "দুপুর ১:০৫", "রাত ১০:০৬" — Bangla day-part + 12-hour clock. */
export function chatTime(iso: string) {
  const [h, m] = hourFmt.format(new Date(iso)).split(":").map(Number);
  const part = h < 4 ? "রাত" : h < 6 ? "ভোর" : h < 12 ? "সকাল" : h < 15 ? "দুপুর" : h < 18 ? "বিকাল" : h < 20 ? "সন্ধ্যা" : "রাত";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return toBn(`${part} ${hour12}:${String(m).padStart(2, "0")}`);
}

/** "আজ" / "গতকাল" / full Bangla date. */
export function chatDayLabel(iso: string, now = new Date()) {
  const key = chatDayKey(iso);
  if (key === dayKey.format(now)) return "আজ";
  if (key === dayKey.format(new Date(now.getTime() - 86_400_000))) return "গতকাল";
  return dateFmt.format(new Date(iso));
}

/** Inbox timestamp: time for today, otherwise a short date. */
export function inboxStamp(iso: string, now = new Date()) {
  return chatDayKey(iso) === dayKey.format(now) ? chatTime(iso) : shortDateFmt.format(new Date(iso));
}
