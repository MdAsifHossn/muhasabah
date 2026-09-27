import { AmalCategory, AmalInputType, BookStatus, CycleStatus, DailyEntryStatus, Role, Weekday } from "@prisma/client";

export const categoryLabels: Record<AmalCategory, string> = { SALAH: "নামাজ", QURAN: "কুরআন", DHIKR: "যিকির ও মুনাজাত", SUNNAH: "সুন্নাহ ও দৈনিক অভ্যাস", CHARACTER: "আখলাক", SERVICE: "খেদমত", SELF_DISCIPLINE: "আত্মসংযম", READING: "দ্বীনি অধ্যয়ন", OTHER: "অন্যান্য" };
export const inputTypeLabels: Record<AmalInputType, string> = { BOOLEAN: "হ্যাঁ/না", NUMBER: "সংখ্যা", MINUTES: "মিনিট", PAGES: "পৃষ্ঠা", AYAT: "আয়াত", COUNT: "গণনা", TEXT: "লিখিত" };
export const cycleStatusLabels: Record<CycleStatus, string> = { DRAFT: "খসড়া", ACTIVE: "সক্রিয়", COMPLETED: "সম্পন্ন", ARCHIVED: "আর্কাইভ" };
export const entryStatusLabels: Record<DailyEntryStatus, string> = { DRAFT: "খসড়া", SUBMITTED: "জমা দেওয়া", LOCKED: "লক করা" };
export const roleLabels: Record<Role, string> = { MEMBER: "সদস্য", USTADH: "উস্তায", ADMIN: "অ্যাডমিন" };
export const weekdayLabels: Record<Weekday, string> = { SUNDAY: "রবিবার", MONDAY: "সোমবার", TUESDAY: "মঙ্গলবার", WEDNESDAY: "বুধবার", THURSDAY: "বৃহস্পতিবার", FRIDAY: "শুক্রবার", SATURDAY: "শনিবার" };
export const bookStatusLabels: Record<BookStatus, string> = { PLANNED: "পরিকল্পিত", READING: "পড়ছি", COMPLETED: "সম্পন্ন", PAUSED: "স্থগিত" };
export const weekdayOrder: Weekday[] = [Weekday.SUNDAY, Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY, Weekday.SATURDAY];