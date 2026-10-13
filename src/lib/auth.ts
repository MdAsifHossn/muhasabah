import { Gender } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";

/**
 * Only MALE / FEMALE / OTHER may ever reach the database — anything else
 * (typo, tampered sign-up payload, legacy value) degrades to OTHER.
 */
function sanitizeGender(value: unknown): Gender {
  if (value === Gender.MALE || value === Gender.FEMALE || value === Gender.OTHER) return value;
  return Gender.OTHER;
}

export const auth = betterAuth({
  appName: "Muhasabah",
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  // Open sign-up: a new member is fully active right away and lands in the
  // dashboard without any admin approval.
  emailAndPassword: { enabled: true, disableSignUp: false, minPasswordLength: 8 },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "MEMBER", input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
      joinedAt: { type: "date", input: false },
      gender: { type: "string", defaultValue: "OTHER", input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, gender: sanitizeGender(user.gender) } }),
      },
      update: {
        before: async (user) =>
          "gender" in user ? { data: { ...user, gender: sanitizeGender(user.gender) } } : undefined,
      },
    },
  },
  advanced: { database: { generateId: false } },
});

export type AuthSession = typeof auth.$Infer.Session;
