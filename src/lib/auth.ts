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
  // Local dev servers may move to another port when 3000 is busy.
  trustedOrigins:
    process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
      : [process.env.BETTER_AUTH_URL, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined, process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined].filter((origin): origin is string => Boolean(origin)),
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
    // A deactivated member cannot open a new session (admin switch in user management).
    session: {
      create: {
        before: async (session) => {
          const owner = await prisma.user.findUnique({ where: { id: session.userId }, select: { isActive: true } });
          if (!owner?.isActive) return false;
        },
      },
    },
    user: {
      create: {
        before: async (user) => ({ data: { ...user, gender: sanitizeGender(user.gender) } }),
      },
      update: {
        // Gender decides which amals are scored: it is set at sign-up, then changed only by
        // server actions (setOwnGender / admin). Self-service profile updates may never touch it.
        before: async (user) => {
          if (!("gender" in user)) return undefined;
          const rest = { ...user } as Record<string, unknown>;
          delete rest.gender;
          return { data: rest };
        },
      },
    },
  },
  // Speed: a signed copy of the session lives in a cookie for 5 minutes, so most
  // page loads skip the session lookup in the remote database. Role / isActive
  // changes take effect within that window (sign-out clears it immediately).
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  advanced: { database: { generateId: false } },
});

export type AuthSession = typeof auth.$Infer.Session;
