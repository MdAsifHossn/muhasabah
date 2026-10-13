"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { auth } from "@/lib/auth";

// `inferAdditionalFields` teaches the client the server's `user.additionalFields`
// (role, isActive, joinedAt, gender) so `signUp.email({ gender })` type-checks
// and the session user carries them back.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
