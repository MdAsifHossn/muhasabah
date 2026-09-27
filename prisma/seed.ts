import { AmalCategory, AmalInputType, CycleStatus, PrismaClient, Role, Weekday } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { addDays } from "date-fns";

import { endOfBangladeshDay, startOfBangladeshDay } from "../src/lib/dates";

const prisma = new PrismaClient();

type SeedItem = {
  titleBn: string;
  category: AmalCategory;
  inputType?: AmalInputType;
  targetValue?: number;
  unit?: string;
  points?: number;
  specificDay?: Weekday;
};

const amalItems: SeedItem[] = [
  { titleBn: "ইশরাকের নামাজ", category: AmalCategory.SALAH },
  { titleBn: "ফজরের সুন্নাত", category: AmalCategory.SALAH },
  { titleBn: "ফজরের তাকবীরে উলা", category: AmalCategory.SALAH },
  { titleBn: "ফজরের পর আয়াতুল কুরসী ও তিন তাসবীহ", category: AmalCategory.SALAH },
  { titleBn: "যুহরের আগের ও পরের সুন্নাত", category: AmalCategory.SALAH },
  { titleBn: "যুহরের তাকবীরে উলা", category: AmalCategory.SALAH },
  { titleBn: "যুহরের পর আয়াতুল কুরসী ও তিন তাসবীহ", category: AmalCategory.SALAH },
  { titleBn: "আসরের তাকবীরে উলা", category: AmalCategory.SALAH },
  { titleBn: "আসরের পর আয়াতুল কুরসী ও তিন তাসবীহ", category: AmalCategory.SALAH },
  { titleBn: "মাগরিবের তাকবীরে উলা", category: AmalCategory.SALAH },
  { titleBn: "মাগরিবের পর আয়াতুল কুরসী ও তিন তাসবীহ", category: AmalCategory.SALAH },
  { titleBn: "মাগরিবের সুন্নাত", category: AmalCategory.SALAH },
  { titleBn: "ইশার তাকবীরে উলা", category: AmalCategory.SALAH },
  { titleBn: "ইশার পর আয়াতুল কুরসী ও তিন তাসবীহ", category: AmalCategory.SALAH },
  { titleBn: "ইশার সুন্নাত", category: AmalCategory.SALAH },
  { titleBn: "তাহাজ্জুদ", category: AmalCategory.SALAH },
  { titleBn: "আধা ঘণ্টার অধিক কুরআন তিলাওয়াত", category: AmalCategory.QURAN, inputType: AmalInputType.MINUTES, targetValue: 30, unit: "মিনিট", points: 2 },
  { titleBn: "অধিক মুনাজাত করা", category: AmalCategory.DHIKR },
  { titleBn: "প্রতিদিন ৭০০ বার নির্ধারিত যিকির", category: AmalCategory.DHIKR, inputType: AmalInputType.COUNT, targetValue: 700, unit: "বার", points: 2 },
  { titleBn: "তরজমা পাঠের পরিমাণ", category: AmalCategory.QURAN, inputType: AmalInputType.AYAT, targetValue: 10, unit: "আয়াত", points: 2 },
  { titleBn: "শুক্রবার সূরা কাহাফের তিলাওয়াত", category: AmalCategory.QURAN, specificDay: Weekday.FRIDAY, points: 2 },
  { titleBn: "প্রত্যেক অজুর পূর্বে মিসওয়াক করা", category: AmalCategory.SUNNAH },
  { titleBn: "প্রত্যেক কাজে মাসনুন দুয়ার আমল", category: AmalCategory.SUNNAH },
  { titleBn: "অতিরিক্ত মোবাইল ব্যবহার না করা", category: AmalCategory.SELF_DISCIPLINE },
  { titleBn: "কারও গীবত বা অপ্রয়োজনীয় কথা না বলা", category: AmalCategory.CHARACTER },
  { titleBn: "রাগ প্রকাশ না করা", category: AmalCategory.CHARACTER },
  { titleBn: "পাপে দৃষ্টি না দেওয়া", category: AmalCategory.SELF_DISCIPLINE },
  { titleBn: "কারও উপকার / খেদমত / সেবা করা", category: AmalCategory.SERVICE },
  { titleBn: "ঘরের কাজে সাহায্য করা", category: AmalCategory.SERVICE },
  { titleBn: "আজকের নফল রোজা (সোম/বৃহস্পতি/আইয়ামে বীজ)", category: AmalCategory.SUNNAH, points: 3 },
  { titleBn: "সময়মতো সুন্নাত অনুযায়ী সেহরি গ্রহণ", category: AmalCategory.SUNNAH },
  { titleBn: "দোয়ার সাথে সময়মতো ইফতার পালন", category: AmalCategory.SUNNAH },
  { titleBn: "দ্বীনি বই পাঠের পরিমাণ", category: AmalCategory.READING, inputType: AmalInputType.PAGES, targetValue: 10, unit: "পৃষ্ঠা", points: 2 },
];

const seedUsers = [
  { name: "মুহাসাবাহ Admin", email: process.env.SEED_ADMIN_EMAIL ?? "admin@muhasabah.local", role: Role.ADMIN },
  { name: "উস্তায", email: "ustadh@muhasabah.local", role: Role.USTADH },
  ...Array.from({ length: 7 }, (_, index) => ({ name: `সদস্য ${index + 1}`, email: `member${index + 1}@muhasabah.local`, role: Role.MEMBER })),
];

async function seedUser(name: string, email: string, role: Role, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;
  const user = await prisma.user.create({ data: { name, email, role, emailVerified: true, isActive: true } });
  await prisma.account.create({ data: { accountId: user.id, providerId: "credential", userId: user.id, password: await hashPassword(password) } });
  return user;
}

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const users = [];
  for (const user of seedUsers) users.push(await seedUser(user.name, user.email, user.role, password));

  for (const [index, item] of amalItems.entries()) {
    const existing = await prisma.amalItem.findFirst({ where: { titleBn: item.titleBn } });
    const data = { ...item, inputType: item.inputType ?? AmalInputType.BOOLEAN, points: item.points ?? 1, order: index + 1, isActive: true };
    if (existing) await prisma.amalItem.update({ where: { id: existing.id }, data });
    else await prisma.amalItem.create({ data });
  }

  const cycleTitle = "Muhasabah Cycle 01";
  const existingCycle = await prisma.cycle.findFirst({ where: { title: cycleTitle } });
  const startDate = startOfBangladeshDay(new Date());
  const endDate = endOfBangladeshDay(addDays(startDate, 39));
  if (!existingCycle) {
    await prisma.cycle.create({ data: { title: cycleTitle, description: "Development seed cycle", startDate, endDate, status: CycleStatus.ACTIVE, createdById: users[0].id } });
  } else {
    await prisma.cycle.update({ where: { id: existingCycle.id }, data: { startDate, endDate, status: CycleStatus.ACTIVE } });
  }

  console.log(`Seed complete: ${amalItems.length} Amal items and ${users.length} development users.`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
