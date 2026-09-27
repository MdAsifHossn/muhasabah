import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  appName: "Muhasabah",
  database: prismaAdapter(prisma, { provider: "mongodb" }),
  emailAndPassword: { enabled: true, disableSignUp: false, minPasswordLength: 8 },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "MEMBER", input: false },
      isActive: { type: "boolean", defaultValue: false, input: false },
      joinedAt: { type: "date", input: false },
    },
  },
  advanced: { database: { generateId: false } },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Make new users pending (isActive = false) by default
          await prisma.user.update({
            where: { id: user.id },
            data: { isActive: false },
          });
        },
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
