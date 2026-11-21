import { AmalAudience, AmalCategory, AmalInputType, type PrismaClient, Weekday } from "@prisma/client";

/**
 * The system (default) Amal list, in display order.
 *
 * Men and women get separate prayer amals:
 * - পুরুষ: প্রতি ওয়াক্তে জামাতের সাথে তাকবীরে উলা
 * - নারী : প্রতি ওয়াক্তের নামাজ আউয়াল ওয়াক্তে (ঘরে) আদায়
 * Friday-only amals live in the জুমা category with `specificDay: FRIDAY`.
 *
 * `legacy` lists older titles so an existing row is updated in place (its
 * history keeps pointing at the same id) instead of being duplicated.
 */
export type CatalogItem = {
  titleBn: string;
  legacy?: string[];
  category: AmalCategory;
  inputType?: AmalInputType;
  targetValue?: number;
  unit?: string;
  points?: number;
  genderScope?: AmalAudience;
  specificDay?: Weekday;
  /** Not applicable on a মাসিক day (prayer, fasting, tilawat). */
  exemptOnPeriod?: boolean;
  description?: string;
};

const { MALE, FEMALE } = AmalAudience;
const salah = (titleBn: string, extra: Partial<CatalogItem> = {}): CatalogItem => ({ titleBn, category: AmalCategory.SALAH, exemptOnPeriod: true, ...extra });

export const AMAL_CATALOG: CatalogItem[] = [
  // ── ফজর ──
  salah("ফজরের সুন্নাত"),
  salah("ফজর — জামাতের সাথে তাকবীরে উলা", { legacy: ["ফজরের তাকবীরে উলা"], genderScope: MALE }),
  salah("ফজর — আউয়াল ওয়াক্তে আদায়", { genderScope: FEMALE }),
  salah("ফজরের পর আয়াতুল কুরসী ও তিন তাসবীহ"),
  salah("ইশরাকের নামাজ"),
  // ── যুহর ──
  salah("যুহরের আগের ও পরের সুন্নাত"),
  salah("যুহর — জামাতের সাথে তাকবীরে উলা", { legacy: ["যুহরের তাকবীরে উলা"], genderScope: MALE }),
  salah("যুহর — আউয়াল ওয়াক্তে আদায়", { genderScope: FEMALE }),
  salah("যুহরের পর আয়াতুল কুরসী ও তিন তাসবীহ"),
  // ── আসর ──
  salah("আসর — জামাতের সাথে তাকবীরে উলা", { legacy: ["আসরের তাকবীরে উলা"], genderScope: MALE }),
  salah("আসর — আউয়াল ওয়াক্তে আদায়", { genderScope: FEMALE }),
  salah("আসরের পর আয়াতুল কুরসী ও তিন তাসবীহ"),
  // ── মাগরিব ──
  salah("মাগরিব — জামাতের সাথে তাকবীরে উলা", { legacy: ["মাগরিবের তাকবীরে উলা"], genderScope: MALE }),
  salah("মাগরিব — আউয়াল ওয়াক্তে আদায়", { genderScope: FEMALE }),
  salah("মাগরিবের পর আয়াতুল কুরসী ও তিন তাসবীহ"),
  salah("মাগরিবের সুন্নাত"),
  // ── ইশা ──
  salah("ইশা — জামাতের সাথে তাকবীরে উলা", { legacy: ["ইশার তাকবীরে উলা"], genderScope: MALE }),
  salah("ইশা — আউয়াল ওয়াক্তে আদায়", { genderScope: FEMALE }),
  salah("ইশার পর আয়াতুল কুরসী ও তিন তাসবীহ"),
  salah("ইশার সুন্নাত ও বিতর"),
  salah("তাহাজ্জুদ"),

  // ── জুমার বিশেষ আমল (শুধু শুক্রবার) ──
  { titleBn: "জুমার দিনের গোসল, পরিচ্ছন্নতা ও সুগন্ধি", category: AmalCategory.JUMUAH, specificDay: Weekday.FRIDAY, genderScope: MALE },
  { titleBn: "আগেভাগে মসজিদে গিয়ে জুমা আদায়", legacy: ["আগেভাগে মসজিদে গিয়ে জুমার নামাজ আদায়"], category: AmalCategory.JUMUAH, specificDay: Weekday.FRIDAY, genderScope: MALE, points: 2 },
  { titleBn: "মনোযোগ দিয়ে খুতবা শোনা", category: AmalCategory.JUMUAH, specificDay: Weekday.FRIDAY, genderScope: MALE },
  { titleBn: "সূরা কাহাফ তিলাওয়াত", legacy: ["শুক্রবার সূরা কাহাফের তিলাওয়াত"], category: AmalCategory.JUMUAH, specificDay: Weekday.FRIDAY, points: 2, exemptOnPeriod: true },
  { titleBn: "দরূদ শরীফ পাঠ", legacy: ["বেশি বেশি দরূদ শরীফ পাঠ"], category: AmalCategory.JUMUAH, specificDay: Weekday.FRIDAY, inputType: AmalInputType.COUNT, targetValue: 100, unit: "বার", points: 2 },
  { titleBn: "আসর থেকে মাগরিব পর্যন্ত দোয়ায় মশগুল থাকা", category: AmalCategory.JUMUAH, specificDay: Weekday.FRIDAY },

  // ── নফল রোজা — শুধু সুন্নাত রোজার দিনে দেখায় (সোম/বৃহস্পতি, আরাফা, আশুরা, আইয়ামে বীজ, শাওয়াল);
  //    নিয়মটি src/lib/amal-rules.ts-এ, শিরোনাম দিয়ে চেনা হয় — শিরোনাম বদলাবেন না। ──
  { titleBn: "নফল রোজা", legacy: ["সোমবারের নফল রোজা", "বৃহস্পতিবারের নফল রোজা", "আজকের নফল রোজা (সোম/বৃহস্পতি/আইয়ামে বীজ)"], category: AmalCategory.SUNNAH, points: 3, exemptOnPeriod: true },

  // ── কুরআন ──
  { titleBn: "কুরআন তিলাওয়াত", legacy: ["আধা ঘণ্টার অধিক কুরআন তিলাওয়াত"], category: AmalCategory.QURAN, inputType: AmalInputType.MINUTES, targetValue: 30, unit: "মিনিট", points: 2, exemptOnPeriod: true },
  { titleBn: "কুরআনের তরজমা পাঠ", legacy: ["তরজমা পাঠের পরিমাণ"], category: AmalCategory.QURAN, inputType: AmalInputType.AYAT, targetValue: 10, unit: "আয়াত", points: 2 },

  // ── যিকির ও দোয়া ──
  { titleBn: "সকাল-সন্ধ্যার মাসনুন যিকির", category: AmalCategory.DHIKR },
  { titleBn: "আল্লাহর কাছে মুনাজাত ও দোয়া", legacy: ["অধিক মুনাজাত করা"], category: AmalCategory.DHIKR },
  { titleBn: "নির্ধারিত যিকির", legacy: ["প্রতিদিন ৭০০ বার নির্ধারিত যিকির"], category: AmalCategory.DHIKR, inputType: AmalInputType.COUNT, targetValue: 700, unit: "বার", points: 2 },

  // ── সুন্নাহ ──
  { titleBn: "অজুর আগে মিসওয়াক করা", legacy: ["প্রত্যেক অজুর পূর্বে মিসওয়াক করা"], category: AmalCategory.SUNNAH },
  { titleBn: "দৈনন্দিন কাজে মাসনুন দোয়া পড়া", legacy: ["প্রত্যেক কাজে মাসনুন দুয়ার আমল"], category: AmalCategory.SUNNAH },

  // ── আত্মসংযম ──
  { titleBn: "শরয়ী পর্দা রক্ষা করা", category: AmalCategory.SELF_DISCIPLINE, genderScope: FEMALE },
  { titleBn: "দৃষ্টির হেফাজত করা", legacy: ["পাপে দৃষ্টি না দেওয়া"], category: AmalCategory.SELF_DISCIPLINE },
  { titleBn: "মোবাইলের অপ্রয়োজনীয় ব্যবহার থেকে বিরত থাকা", legacy: ["অতিরিক্ত মোবাইল ব্যবহার না করা"], category: AmalCategory.SELF_DISCIPLINE },

  // ── আখলাক ──
  { titleBn: "গীবত ও অনর্থক কথা থেকে বিরত থাকা", legacy: ["কারও গীবত বা অপ্রয়োজনীয় কথা না বলা"], category: AmalCategory.CHARACTER },
  { titleBn: "রাগ নিয়ন্ত্রণে রাখা", legacy: ["রাগ প্রকাশ না করা"], category: AmalCategory.CHARACTER },
  { titleBn: "পরিবারের সাথে ভালো ব্যবহার", category: AmalCategory.CHARACTER },
  { titleBn: "আত্মীয়দের খোঁজ নেওয়া", category: AmalCategory.CHARACTER },

  // ── খেদমত ──
  { titleBn: "মানুষের উপকার ও খেদমত করা", legacy: ["কারও উপকার / খেদমত / সেবা করা"], category: AmalCategory.SERVICE },
  { titleBn: "ঘরের কাজে সহযোগিতা করা", legacy: ["ঘরের কাজে সাহায্য করা"], category: AmalCategory.SERVICE },

  // ── অধ্যয়ন ──
  { titleBn: "দ্বীনি বই পাঠ", legacy: ["দ্বীনি বই পাঠের পরিমাণ"], category: AmalCategory.READING, inputType: AmalInputType.PAGES, targetValue: 10, unit: "পৃষ্ঠা", points: 2 },
];

/**
 * System amals removed from the list for good (Ustadhji's decision): the rows
 * are deleted. Old answers that pointed at them are simply ignored by reports.
 * - সেহরি / ইফতার: a নফল রোজার দিন needs only the রোজা itself.
 */
const REMOVED_TITLES = ["সময়মতো সুন্নাত অনুযায়ী সেহরি গ্রহণ", "দোয়ার সাথে সময়মতো ইফতার পালন"];

/** Old system items that the catalog replaced by a renamed entry. */
const RENAMED_LEGACY: Record<string, string> = { "ইশার সুন্নাত": "ইশার সুন্নাত ও বিতর" };

/**
 * Idempotently brings the system amal list in line with the catalog.
 * - Only system rows (`createdById: null`) are touched; Ustadh-made items keep
 *   their own settings and are ordered after the catalog.
 * - `isActive` of an existing row is preserved (an admin may have switched it off).
 */
export async function syncAmalCatalog(prisma: PrismaClient) {
  let created = 0;
  let updated = 0;
  let removed = 0;
  // Bengali has two encodings for য় / ড় / ঢ় (precomposed vs. base + nukta), so
  // titles are compared after NFC normalisation — never by raw string equality.
  const norm = (value: string) => value.normalize("NFC").trim();
  const rows = await prisma.amalItem.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, titleBn: true } });

  for (const [index, item] of AMAL_CATALOG.entries()) {
    const titles = new Set(
      [item.titleBn, ...(item.legacy ?? []), ...Object.entries(RENAMED_LEGACY).filter(([, to]) => to === item.titleBn).map(([from]) => from)].map(norm),
    );
    const matches = rows.filter((row) => titles.has(norm(row.titleBn)));
    const existing = matches[0];
    // Extra copies of the same amal: drop them only if no entry ever used them.
    for (const duplicate of matches.slice(1)) {
      const used = await prisma.dailyAmalEntry.count({ where: { responses: { some: { amalItemId: duplicate.id } } } });
      if (!used) {
        await prisma.amalItem.delete({ where: { id: duplicate.id } });
        removed += 1;
      }
    }
    const data = {
      titleBn: item.titleBn,
      category: item.category,
      inputType: item.inputType ?? AmalInputType.BOOLEAN,
      targetValue: item.targetValue ?? null,
      unit: item.unit ?? null,
      points: item.points ?? 1,
      genderScope: item.genderScope ?? AmalAudience.ALL,
      specificDay: item.specificDay ?? null,
      exemptOnPeriod: item.exemptOnPeriod ?? false,
      order: (index + 1) * 10,
    };
    if (existing) {
      await prisma.amalItem.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.amalItem.create({ data: { ...data, isActive: true, createdById: null } });
      created += 1;
    }
  }

  // Ustadh-made items follow the catalog, keeping their relative order.
  const custom = await prisma.amalItem.findMany({ where: { createdById: { not: null } }, orderBy: { order: "asc" }, select: { id: true } });
  for (const [index, item] of custom.entries()) {
    await prisma.amalItem.update({ where: { id: item.id }, data: { order: (AMAL_CATALOG.length + index + 1) * 10 } });
  }
  // Removed system amals: delete the rows entirely.
  const removedTitles = new Set(REMOVED_TITLES.map(norm));
  // (MongoDB: `createdById: null` misses rows where the field was never set, so filter here.)
  const allRows = await prisma.amalItem.findMany({ select: { id: true, titleBn: true, createdById: true } });
  for (const row of allRows.filter((candidate) => candidate.createdById == null && removedTitles.has(norm(candidate.titleBn)))) {
    await prisma.amalItem.delete({ where: { id: row.id } });
    removed += 1;
  }
  return { created, updated, removed, total: AMAL_CATALOG.length };
}
