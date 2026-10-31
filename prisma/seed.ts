import { CycleStatus, Gender, PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { addDays } from "date-fns";

import { endOfBangladeshDay, startOfBangladeshDay } from "../src/lib/dates";
import { syncAmalCatalog } from "./amal-catalog";

const prisma = new PrismaClient();

/**
 * Idempotent seed:
 * 1. syncs the system amal list (men / women / Friday) — safe on live data;
 * 2. creates the role test accounts (only if missing — never resets a password);
 * 3. makes sure an active cycle exists.
 * Passwords come from .env (SEED_TEST_PASSWORD_*), never from source.
 */
const testUsers = [
  { name: "পরীক্ষা উস্তাদজি (সিস্টেম অ্যাডমিন)", email: "admin.test@muhasabah.app", role: Role.USTADH, gender: Gender.MALE, passwordEnv: "SEED_TEST_PASSWORD_ADMIN" },
  { name: "পরীক্ষা উস্তাদজি", email: "ustad.test@muhasabah.app", role: Role.USTADH, gender: Gender.MALE, passwordEnv: "SEED_TEST_PASSWORD_USTADH" },
  { name: "পরীক্ষা ভাই", email: "bhai.test@muhasabah.app", role: Role.MEMBER, gender: Gender.MALE, passwordEnv: "SEED_TEST_PASSWORD_MEMBER" },
  { name: "পরীক্ষা বোন", email: "bon.test@muhasabah.app", role: Role.MEMBER, gender: Gender.FEMALE, passwordEnv: "SEED_TEST_PASSWORD_MEMBER" },
] as const;

async function seedUser(user: (typeof testUsers)[number]) {
  const password = process.env[user.passwordEnv];
  if (!password) {
    console.warn(`skip ${user.email}: ${user.passwordEnv} is not set`);
    return null;
  }
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) return existing;
  const created = await prisma.user.create({
    data: { name: user.name, email: user.email, role: user.role, gender: user.gender, emailVerified: true, isActive: true },
  });
  await prisma.account.create({ data: { accountId: created.id, providerId: "credential", userId: created.id, password: await hashPassword(password) } });
  return created;
}

async function main() {
  // Collapse the old two-tier staff model. Existing ADMIN accounts retain
  // their identity and data, but become the single Ustadhji administrator.
  const migrated = await prisma.user.updateMany({ where: { role: Role.ADMIN }, data: { role: Role.USTADH } });
  if (migrated.count) console.log(`Migrated ${migrated.count} legacy admin account(s) to Ustadhji.`);
  const catalog = await syncAmalCatalog(prisma);
  console.log(`Amal catalog: ${catalog.updated} updated, ${catalog.created} created, ${catalog.removed} duplicates removed (${catalog.total} total).`);

  const users = [];
  for (const user of testUsers) users.push(await seedUser(user));
  const admin = users.find(Boolean) ?? (await prisma.user.findFirst({ where: { role: Role.USTADH } }));

  const active = await prisma.cycle.findFirst({ where: { status: CycleStatus.ACTIVE } });
  if (!active && admin) {
    const startDate = startOfBangladeshDay(new Date());
    await prisma.cycle.create({
      data: { title: "মুহাসাবাহ সাইকেল ০১", description: "৪০ দিনের আমলনামা", startDate, endDate: endOfBangladeshDay(addDays(startDate, 39)), status: CycleStatus.ACTIVE, createdById: admin.id },
    });
    console.log("Created an active 40-day cycle.");
  }

  console.log(`Test accounts ready: ${users.filter(Boolean).length}/${testUsers.length}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
